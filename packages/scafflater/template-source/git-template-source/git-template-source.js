const LocalFolderTemplateSource = require("../local-folder-template-source/local-folder-template-source");
const fsUtil = require("../../fs-util");
const { ScafflaterOptions } = require("../../options");
const { LocalTemplate } = require("../../scafflater-config/local-template");
const Source = require("../../scafflater-config/source");
const ScafflaterFileNotFoundError = require("../../errors/ScafflaterFileNotFoundError");
const { TemplateDefinitionNotFound } = require("../../errors");
const { exec } = require("child_process");
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
   * @returns {Promise<bool>} True if the authentication is ok.
   */
  static checkGitClient() {
    return new Promise((resolve, reject) => {
      exec("git config user.name", (error, stdout, stderr) => {
        if (error) {
          if (error.message.match(/command not found/gi)) {
            error = new GitNotInstalledError();
          }
          reject(error);
          return;
        }
        if ((stdout + stderr).trim().length <= 0) {
          reject(new GitUserNotLoggedError());
          return;
        }

        resolve(true);
      });
    });
  }

  /**
   * Gets the template and copies it in a local folder.
   *
   * @param {string} sourceKey - The source key (<OWNER>/<REPOSITORY>) of template.
   * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
   * @returns {Promise<LocalTemplate>} The local template
   */
  async getTemplate(sourceKey, outputDir = null) {
    return new Promise((resolve, reject) => {
      const pathToClone = fsUtil.getTempFolderSync();

      const cb = (error) => {
        if (error) {
          reject(error);
          return;
        }

        super
          .getTemplate(pathToClone, outputDir)
          .then((localTemplate) => resolve(localTemplate))
          .catch((e) => {
            if (e instanceof ScafflaterFileNotFoundError) {
              e = new ScafflaterFileNotFoundError(
                `${sourceKey}/.scafflater/scafflater.jsonc`
              );
            }
            if (e instanceof TemplateDefinitionNotFound) {
              e = new TemplateDefinitionNotFound(
                `${sourceKey}/.scafflater/scafflater.jsonc`
              );
            }
            reject(e);
            throw e;
          });
      };

      exec(`git clone ${sourceKey} ${pathToClone}`, cb);
    });
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
