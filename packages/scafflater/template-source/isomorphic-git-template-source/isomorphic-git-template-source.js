const fsUtil = require("../../fs-util");
const git = require("isomorphic-git");
const http = require("isomorphic-git/http/node");
const fs = require("fs-extra");
const { spawn } = require("child_process");
const { URL } = require("url");
const LocalFolderTemplateSource = require("../local-folder-template-source/local-folder-template-source");
const { ScafflaterOptions } = require("../../options");
const { LocalTemplate } = require("../../scafflater-config/local-template");
const Source = require("../../scafflater-config/source");
const ScafflaterFileNotFoundError = require("../../errors/scafflater-file-not-found-error");
const { TemplateDefinitionNotFound } = require("../../errors");

/**
 * Clones a repo to a local path.
 *
 * @param {string} repo - Repository (<owner>/<repository>)
 * @param {string} localPath - Local path where the repos will be cloned
 * @param {string} username The github user
 * @param {string} password The github password
 * @returns {Promise} The command messages
 */
async function clone(repo, localPath, username = null, password = null) {
  const headers = {};

  if (username && password) {
    const t = `${username}:${password}`;
    headers.Authorization = `Basic ${Buffer.from(t).toString("base64")}`;
  }

  try {
    return await git.clone({
      fs,
      http,
      url: repo,
      dir: localPath,
      singleBranch: true,
      depth: 1,
      headers,
    });
  } catch (error) {
    throw new Error(
      `Clone failed: ${error} (Authorization Header: '${headers.Authorization}')`
    );
  }
}

class IsomorphicGitTemplateSource extends LocalFolderTemplateSource {
  /**
   * Checks if the sourceKey is valid for this TemplateSource
   *
   * @param {string} sourceKey - The source key to be validated.
   * @returns {boolean} Returns true if the key is valid
   */
  static isValidSourceKey(sourceKey) {
    return /https?:\/\/(www.)?github.com/.test(sourceKey);
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
   * Gets the template and copies it in a local folder.
   *
   * @param {string} sourceKey - The source key (<OWNER>/<REPOSITORY>) of template.
   * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
   * @returns {Promise<LocalTemplate>} The local template
   */
  async getTemplate(sourceKey, outputDir = null) {
    const pathToClone = await fsUtil.getTempFolder();
    await clone(
      sourceKey,
      pathToClone,
      this.options.githubUsername,
      this.options.githubPassword
    );

    try {
      return await super.getTemplate(pathToClone, outputDir);
    } catch (error) {
      if (error instanceof ScafflaterFileNotFoundError) {
        throw new ScafflaterFileNotFoundError(`${sourceKey}/.scafflater`);
      }
      if (error instanceof TemplateDefinitionNotFound) {
        throw new TemplateDefinitionNotFound(`${sourceKey}/.scafflater`);
      }
      throw error;
    }
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

module.exports = IsomorphicGitTemplateSource;
