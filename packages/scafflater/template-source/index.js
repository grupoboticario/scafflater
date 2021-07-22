const ScafflaterOptions = require("../options");
const { LocalTemplate } = require("../scafflater-config/local-template");
const Source = require("../scafflater-config/source");

// TODO: Refact this code to match the same pattern of template manager

/**
 * TemplateSource factory.
 */
class TemplateSource {
  /**
   * Template Source constructor.
   *
   * @param {?ScafflaterOptions} options - Scafflater Options. If null, will get the default options.
   */
  constructor(options = {}) {
    this.options = new ScafflaterOptions(options);
    this.source = this.options.source;
  }

  /**
   * The source name.
   *
   * @type {string}
   */
  source;

  /**
   * Resolves the template source from source key.
   *
   * @param {ScafflaterOptions} options The Scafflater Options
   * @param {string} sourceKey - The key of source path. Ir can be a local folder path, a git url, or other path that is recognized by template source through isValidSourceKey function
   * @returns {TemplateSource} An specialized instance of TemplateSource.
   */
  static resolveTemplateSourceFromSourceKey(options, sourceKey) {
    for (const source in options.sources) {
      if (require(options.sources[source]).isValidSourceKey(sourceKey))
        return source;
    }
  }

  /**
   * Returns the template source instance to be used to get templates.
   *
   * @param {?object} config - Scafflater configuration. If null, will get the default configuration.
   * @returns {TemplateSource} An specialized instance of TemplateSource.
   */
  static getTemplateSource(config) {
    config = { ...new ScafflaterOptions(), ...config };

    if (!config.sources[config.source]) {
      throw new Error(`There's no module for source '${config.source}'`);
    }

    return new (require(config.sources[config.source]))(config);
  }

  /**
   * Gets the template and copies it in a local folder.
   *
   * @param {string} sourceKey - The source key of template. Will vary, depending on template source
   * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
   * @returns {Promise<LocalTemplate>} The local template
   */
  async getTemplate(sourceKey, outputDir = null) {
    return TemplateSource.getTemplateSource().getTemplate(sourceKey, outputDir);
  }

  /**
   * Gets an Source object for this source
   *
   * @param {string} key The source key
   * @returns {Source} An Source object
   */
  getSource(key) {
    return TemplateSource.getTemplateSource().getSource(key);
  }
}

module.exports = TemplateSource;
