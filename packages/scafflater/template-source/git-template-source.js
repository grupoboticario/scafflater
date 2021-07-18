const LocalFolderTemplateSource = require("./local-folder-template-source");
const GitUtil = require("../git-util");
const fsUtil = require("../fs-util");
const path = require("path");
const OptionsProvider = require("../options-provider");

class GitTemplateSource extends LocalFolderTemplateSource {
  /**
   * Checks if the sourceKey is valid for this TemplateSource
   * @param {string} sourceKey - The source key to be validated.
   * @return {boolean} Returns true if the key is valid
   */
  static isValidSourceKey(sourceKey) {
    return /https?:\/\/(www.)?github.com/.test(sourceKey);
  }

  /**
   * Template Source constructor.
   * @param {?object} config - Scafflater configuration. If null, will get the default configuration.
   */
  constructor(config = {}) {
    config = { ...new OptionsProvider(), ...config };
    super(config);
  }

  /**
   * Gets the template and copies it in a local folder.
   * @param {string} sourceKey - The source key (<OWNER>/<REPOSITORY>) of template.
   * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
   * @return {object.path} Path where the template was copied.
   * @return {object.config} The template config.
   */
  async getTemplate(sourceKey, outputDir = null) {
    const pathToClone = await fsUtil.getTempFolder();
    await GitUtil.clone(
      sourceKey,
      pathToClone,
      this.options.github_username,
      this.options.github_password
    );

    const { path: out } = await super.getTemplate(pathToClone, outputDir);
    const config = {
      ...(await fsUtil.readJSON(path.join(out, ".scafflater"))),
      source: {
        name: "github",
        key: sourceKey,
        github: {
          baseUrl: this.options.github_baseUrl,
          baseUrlApi: this.options.github_baseUrlApi,
        },
      },
    };

    // TODO: Validate template configuration

    return Promise.resolve({
      path: out,
      config,
    });
  }
}

module.exports = GitTemplateSource;
