const LocalFolderTemplateSource = require("../local-folder-template-source/local-folder-template-source");
const fsUtil = require("../../fs-util");
const { ScafflaterOptions } = require("../../options");
const { LocalTemplate } = require("../../scafflater-config/local-template");
const Source = require("../../scafflater-config/source");
const ScafflaterFileNotFoundError = require("../../errors/scafflater-file-not-found-error");
const { TemplateDefinitionNotFound } = require("../../errors");
const util = require("util");
const { GitNotInstalledError, GitUserNotLoggedError } = require("./errors");

class GitTemplateSource extends LocalFolderTemplateSource {
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
   * @param {string} sourceKey - The source key (<OWNER>/<REPOSITORY>) of template.
   * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
   * @returns {Promise<LocalTemplate>} The local template
   */
  async getTemplate(sourceKey, outputDir = null) {
    await GitTemplateSource.checkGitClient();

    const pathToClone = fsUtil.getTempFolderSync();

    const exec = util.promisify(require("child_process").exec);
    await exec(`git clone ${sourceKey} ${pathToClone}`, { timeout: 15000 });
    try {
      return super.getTemplate(pathToClone, outputDir);
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
