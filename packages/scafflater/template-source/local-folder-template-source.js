const TemplateSource = require("./");
const fsUtil = require("../fs-util");
const path = require("path");
const { LocalTemplate } = require("../scafflater-config/local-template");
const ScafflaterOptions = require("../options");
const Source = require("../scafflater-config/source");

class LocalFolderTemplateSource extends TemplateSource {
  /**
   * Checks if the sourceKey is valid for this TemplateSource
   *
   * @param {string} sourceKey - The source key to be validated.
   * @returns {boolean} Returns true if the key is valid
   */
  static isValidSourceKey(sourceKey) {
    return fsUtil.existsSync(sourceKey);
  }

  /**
   * Template Source constructor.
   *
   * @param {ScafflaterOptions} options - Scafflater configuration. If null, will get the default configuration.
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
    const out = outputDir || (await fsUtil.getTempFolder());

    const _this = this;
    await fsUtil.copy(sourceKey, out, {
      filter: function (sourcePath) {
        return !_this.options.ignores(sourceKey, sourcePath);
      },
    });

    const outConfigPath = path.resolve(out, ".scafflater");
    const localTemplate = (await LocalTemplate.loadFromPath(outConfigPath))[0];

    return Promise.resolve(localTemplate);
  }

  /**
   * Gets an Source object for this source
   *
   * @param {string} key The source key
   * @returns {Source} An Source object
   */
  getSource(key) {
    return new Source("localFolder", key);
  }
}

module.exports = LocalFolderTemplateSource;
