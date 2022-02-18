const LocalFolderTemplateSource = require("../local-folder-template-source/local-folder-template-source");
const fsUtil = require("../../fs-util");
const { ScafflaterOptions } = require("../../options");
const { LocalTemplate } = require("../../scafflater-config/local-template");
const { Source } = require("../../scafflater-config/source");
const ScafflaterFileNotFoundError = require("../../errors/scafflater-file-not-found-error");
const { TemplateDefinitionNotFound } = require("../../errors");
const util = require("util");
const { GitNotInstalledError, GitUserNotLoggedError } = require("./errors");
const { EOL } = require("os");
const InvalidArgumentError = require("../../errors/invalid-argument-error");
const semver = require("semver");
const { NoVersionAvailableError, VersionDoesNotExist } = require("../errors");

class GitTemplateSource extends LocalFolderTemplateSource {
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
  }

  /**
   * Checks if the GH client is installed and authenticated
   *
   * @returns {Promise<boolean>} True if the authentication is ok.
   */
  static async checkGitClient() {
    try {
      const exec = util.promisify(require("child_process").exec);
      const { stdout, stderr } = await exec("git config user.name", {
        timeout: 15000,
      });
      if ((stdout + stderr).trim().length <= 0) {
        throw new GitUserNotLoggedError();
      }
    } catch (error) {
      if (error) {
        if (error.message.match(/command not found/gi)) {
          throw new GitNotInstalledError();
        }
      }
      throw error;
    }

    return true;
  }

  /**
   * Gets the template and copies it in a local folder.
   *
   * @param {string} sourceKey - The source key of template. Will vary, depending on template source
   * @param {string} version - The template version.
   * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
   * @returns {Promise<LocalTemplate>} The local template
   */
  async getTemplate(sourceKey, version = "head", outputDir = null) {
    await GitTemplateSource.checkGitClient();

    const pathToClone = fsUtil.getTempFolderSync();

    const exec = util.promisify(require("child_process").exec);

    const resolvedVersion = await this.resolveVersion(sourceKey, version);
    const tagArgument =
      resolvedVersion === "head" ? "" : ` -b ${resolvedVersion}`;

    await exec(`git clone${tagArgument} ${sourceKey} ${pathToClone}`, {
      timeout: 15000,
    });

    try {
      return await super.getTemplate(pathToClone, outputDir);
    } catch (error) {
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
   * Resolves the template version to be fetched.
   *
   * @param {string} sourceKey - The source key of template. Will vary, depending on template source
   * @param {string} version - The template version
   * @returns {Promise<string>} The string to be fetched
   */
  async resolveVersion(sourceKey, version) {
    if (!version || version === "last") {
      try {
        return await this.getLastVersion(sourceKey);
      } catch (error) {
        if (error instanceof NoVersionAvailableError) {
          return "head";
        } else {
          throw error;
        }
      }
    }

    if (
      version !== "head" &&
      !(await this.isVersionAvailable(sourceKey, version))
    ) {
      throw new VersionDoesNotExist(sourceKey, version);
    }

    return version;
  }

  /**
   * Gets the last version.
   *
   * @param {string} sourceKey - The source key of template. Will vary, depending on template source
   * @returns {Promise<string>} Returns the string with the last version
   * @throws {NoVersionAvailableError} Theres no version available for this sourceKey
   */
  async getLastVersion(sourceKey) {
    const exec = util.promisify(require("child_process").exec);

    const { stdout } = await exec(
      `git ls-remote --tags --sort="v:refname" ${sourceKey}`
    );

    const lines = stdout.split(EOL);

    for (let line = lines.length - 1; line >= 0; line--) {
      const lineVersion = /v?\d+\.\d+\.\d+$/.exec(lines[line]);
      if (lineVersion) {
        return lineVersion[0];
      }
    }

    throw new NoVersionAvailableError(sourceKey);
  }

  /**
   * Checks if version is available.
   *
   * @param {string} sourceKey - The source key of template. Will vary, depending on template source
   * @param {string} version - The template version
   * @returns {Promise<boolean>} true if version is available
   * @throws {InvalidArgumentError} The version must be in semver pattern
   */
  async isVersionAvailable(sourceKey, version) {
    if (!semver.valid(version)) {
      throw new InvalidArgumentError("version", version);
    }

    const exec = util.promisify(require("child_process").exec);

    const { stdout } = await exec(
      `git ls-remote --tags --sort="v:refname" ${sourceKey}`
    );

    for (const line of stdout.split(EOL)) {
      const lineVersion = /(?<=[v/])(?<version>\d+\.\d+\.\d+)$/.exec(line);
      if (
        lineVersion &&
        semver.compare(lineVersion.groups.version, version) === 0
      ) {
        return true;
      }
    }

    return false;
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

module.exports = GitTemplateSource;
