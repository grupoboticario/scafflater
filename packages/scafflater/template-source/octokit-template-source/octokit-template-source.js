const LocalFolderTemplateSource = require("../local-folder-template-source/local-folder-template-source");
const fsUtil = require("../../fs-util");
const { ScafflaterOptions } = require("../../options");
const { LocalTemplate } = require("../../scafflater-config/local-template");
const { Source } = require("../../scafflater-config/source");
const ScafflaterFileNotFoundError = require("../../errors/scafflater-file-not-found-error");
const { TemplateDefinitionNotFound } = require("../../errors");
const { NoVersionAvailableError, VersionDoesNotExist } = require("../errors");
const GitUrlParse = require("git-url-parse");
const { Octokit } = require("@octokit/rest");
const path = require("path");
const { Parse } = require("unzipper");

/**
 * A custom unzip do extract a zip downloaded from Github
 *
 * @description The zip downloaded from Github has a file on top of the archive that contains the repository content. This functions moves this first level from path.
 * @param {string} zipfile Zip file path
 * @param {string} dir Directory path where zip must be extracted
 * @returns {Promise} A promise to await the unzip process
 */
const unzip = (zipfile, dir) => {
  const stream = fsUtil.createReadStream(zipfile).pipe(Parse());

  return new Promise((resolve, reject) => {
    stream.on("entry", (entry) => {
      const destPath = path.join(dir, entry.path.replace(/^[^/]+\//, ""));

      if (entry.type === "Directory") {
        if (!fsUtil.pathExistsSync(destPath)) {
          fsUtil.mkdirSync(destPath);
        }
        return entry.autodrain();
      } else {
        const writeStream = fsUtil.createWriteStream(destPath);
        return entry.pipe(writeStream);
      }
    });
    stream.on("finish", () => resolve());
    stream.on("error", (error) => reject(error));
  });
};

class OctokitTemplateSource extends LocalFolderTemplateSource {
  /**
   * Checks if the sourceKey is valid for this TemplateSource
   *
   * @param {string} sourceKey - The source key to be validated.
   * @returns {boolean} Returns true if the key is valid
   */
  static isValidSourceKey(sourceKey) {
    return /((https?:\/\/(www.)?github.com\/)|(git@github.com:))([^/]+)\/([^/]+)/.test(
      sourceKey
    );
  }

  /**
   * Template Source constructor.
   *
   * @param {?ScafflaterOptions} options - Scafflater options. If null, will get the default configuration.
   */
  constructor(options = {}) {
    super(options);
    this.octokit = new Octokit(
      this.options.githubPassword || this.options.githubToken
    );
  }

  /**
   * Gets the template and copies it in a local folder.
   *
   * @param {string} sourceKey - The source key of template. Will vary, depending on template source
   * @param {string} version - The template version.
   * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
   * @returns {Promise<LocalTemplate>} The local template
   */
  async getTemplate(sourceKey, version = "last", outputDir = null) {
    try {
      const ghUrl = GitUrlParse(sourceKey);
      const pathToClone = fsUtil.getTempFolderSync();
      const zipballPath = path.join(fsUtil.getTempFolderSync(), "head.zip");

      const resolvedVersion = await this.resolveVersion(sourceKey, version);

      if (resolvedVersion.version === "head") {
        const response = await this.octokit.request(
          "GET /repos/{owner}/{repo}/zipball",
          {
            owner: ghUrl.owner,
            repo: ghUrl.name,
          }
        );
        fsUtil.appendFileSync(zipballPath, Buffer.from(response.data));
      } else if (resolvedVersion.refType === "tag") {
        const response = await this.octokit.request(
          "GET /repos/{owner}/{repo}/zipball/{ref}",
          {
            owner: ghUrl.owner,
            repo: ghUrl.name,
            ref: resolvedVersion.version,
          }
        );
        fsUtil.appendFileSync(zipballPath, Buffer.from(response.data));
      }

      await unzip(zipballPath, pathToClone);
      return await super.getTemplate(pathToClone, outputDir);
    } catch (error) {
      console.log(error.stack);
      if (error instanceof ScafflaterFileNotFoundError) {
        throw new ScafflaterFileNotFoundError(
          `${sourceKey}/.scafflater/scafflater.jsonc`
        );
      }
      if (error instanceof TemplateDefinitionNotFound) {
        throw new TemplateDefinitionNotFound(
          `${sourceKey}/.scafflater/scafflater.jsonc`
        );
      }
      throw error;
    }
  }

  /**
   * @typedef GithubVersionRef
   * @property {"branch"|"tag"} refType The reference type
   * @property {string} version The version
   */

  /**
   * Resolves the template version to be fetched.
   *
   * @param {string} sourceKey - The source key of template. Will vary, depending on template source
   * @param {string} version - The template version
   * @returns {Promise<GithubVersionRef>} The string to be fetched
   */
  async resolveVersion(sourceKey, version) {
    if (version === "head") {
      return { refType: "branch", version: "head" };
    }

    if (!version || version === "last" || version === "latest") {
      try {
        return {
          refType: "release",
          version: await this.getLastVersion(sourceKey),
        };
      } catch (error) {
        if (error instanceof NoVersionAvailableError) {
          return { refType: "branch", version: "head" };
        } else {
          throw error;
        }
      }
    }

    const versionRef = await this.getAvailableRef(sourceKey, version);
    if (version !== "head" && !versionRef) {
      throw new VersionDoesNotExist(sourceKey, version);
    }

    return versionRef;
  }

  /**
   * Gets the last version.
   *
   * @param {string} sourceKey - The source key of template. Will vary, depending on template source
   * @returns {Promise<string>} Returns the string with the last version
   * @throws {NoVersionAvailableError} Theres no version available for this sourceKey
   */
  async getLastVersion(sourceKey) {
    const ghUrl = GitUrlParse(sourceKey);

    try {
      const latest = await this.octokit.request(
        "GET /repos/{owner}/{repo}/releases/latest",
        {
          owner: ghUrl.owner,
          repo: ghUrl.name,
        }
      );

      return latest.data.name;
    } catch (e) {
      if (e.status === 404) {
        throw new NoVersionAvailableError(sourceKey);
      }
      throw e;
    }
  }

  /**
   * Checks if version is available.
   *
   * @param {string} sourceKey - The source key of template. Will vary, depending on template source
   * @param {string} version - The template version
   * @returns {Promise<boolean>} true if the version is available
   */
  async isVersionAvailable(sourceKey, version) {
    return this.getAvailableRef(sourceKey, version) !== null;
  }

  /**
   * Gets the reference of a version.
   *
   * @description Try to identify if there is a tag, branch or release, respecting this order, with de same name of the version.
   * @param {string} sourceKey - The source key of template. Will vary, depending on template source
   * @param {string} version - A tag, brach or release name
   * @returns {Promise<GithubVersionRef>} The version reference if it exists. null otherwise.
   */
  async getAvailableRef(sourceKey, version) {
    const ghUrl = GitUrlParse(sourceKey);

    // Trying tag
    try {
      await this.octokit.request(
        "GET /repos/{owner}/{repo}/git/ref/tags/{tag_name}",
        {
          owner: ghUrl.owner,
          repo: ghUrl.name,
          tag_name: version,
        }
      );

      return { refType: "tag", version };
    } catch (e) {
      if (!e.status && e.status !== 404) {
        throw e;
      }
    }

    // Trying branch
    try {
      await this.octokit.request(
        "GET /repos/{owner}/{repo}/branches/{branch}",
        {
          owner: ghUrl.owner,
          repo: ghUrl.name,
          branch: version,
        }
      );

      return { refType: "branch", version };
    } catch (e) {
      if (!e.status && e.status !== 404) {
        throw e;
      }
    }

    // Trying release name
    try {
      let page = 1;
      let releases = [];
      do {
        page = 1;
        releases = await this.octokit.request(
          "GET /repos/{owner}/{repo}/releases",
          {
            owner: ghUrl.owner,
            repo: ghUrl.name,
            per_page: 100,
            page,
          }
        );

        const releaseIndex = releases.data.findIndex((r) => r.name === version);
        if (releaseIndex >= 0) {
          return {
            refType: "tag",
            version: releases.data[releaseIndex].tag_name,
          };
        }
        page++;
      } while (releases.data.length > 0);
    } catch (e) {
      if (!e.status && e.status !== 404) {
        throw e;
      }
    }

    return null;
  }

  /**
   * Gets an Source object for this source
   *
   * @param {string} key The source key
   * @returns {Source} An Source object
   */
  getSource(key) {
    return new Source("github", key, {
      baseUrl: this.options.githubBaseUrl,
      baseUrlApi: this.options.githubBaseUrlApi,
    });
  }
}

module.exports = OctokitTemplateSource;
