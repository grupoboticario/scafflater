const TemplateSource = require("./");
const fsUtil = require("../fs-util");
const path = require("path");

class LocalFolderTemplateSource extends TemplateSource {
  /**
   * Checks if the sourceKey is valid for this TemplateSource
   * @param {string} sourceKey - The source key to be validated.
   * @return {boolean} Returns true if the key is valid
   */
  static isValidSourceKey(sourceKey) {
    return fsUtil.existsSync(sourceKey);
  }

  /**
   * Template Source constructor.
   * @param {ScafflaterOptions} options - Scafflater configuration. If null, will get the default configuration.
   */
  constructor(options = {}) {
    super(options);
  }

  /**
   * Gets the template and copies it in a local folder.
   * @param {string} sourceKey - The source key (<OWNER>/<REPOSITORY>) of template.
   * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
   * @return {Promise<object>} Path where the template was copied.
   * @return {object.path} Path where the template was copied.
   * @return {object.config} The template config.
   */
  async getTemplate(sourceKey, outputDir = null) {
    const out = outputDir || (await fsUtil.getTempFolder());

    const _this = this;
    await fsUtil.copy(sourceKey, out, {
      filter: function (sourcePath) {
        return !_this.options.ignores(sourceKey, sourcePath);
      },
    });
    const config = {
      ...(await fsUtil.readJSON(path.join(out, ".scafflater"))),
      source: {
        name: "localFolder",
        key: sourceKey,
      },
    };

    // TODO: Validate template configuration

    return Promise.resolve({
      path: out,
      config,
    });
  }
}

module.exports = LocalFolderTemplateSource;
