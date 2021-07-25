const LocalFolderTemplateSource = require("./local-folder-template-source");
const GitUtil = require("../git-util");
const fsUtil = require("../fs-util");
const ScafflaterOptions = require("../options");
const { LocalTemplate } = require("../scafflater-config/local-template");
const Source = require("../scafflater-config/source");
const ScafflaterFileNotFoundError = require("../errors/ScafflaterFileNotFoundError");
const { TemplateDefinitionNotFound } = require("../errors");

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
   * Gets the template and copies it in a local folder.
   *
   * @param {string} sourceKey - The source key (<OWNER>/<REPOSITORY>) of template.
   * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
   * @returns {Promise<LocalTemplate>} The local template
   */
  async getTemplate(sourceKey, outputDir = null) {
    const pathToClone = await fsUtil.getTempFolder();
    await GitUtil.clone(
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

module.exports = GitTemplateSource;
