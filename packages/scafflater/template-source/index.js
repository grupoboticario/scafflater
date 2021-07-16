const OptionsProvider = require("../options-provider")

/**
* TemplateSource factory.
*/
class TemplateSource {
  /**
  * Template Source constructor.
  * @param {?object} config - Scafflater configuration. If null, will get the default configuration.
  */
  constructor(config = {}) {
    this.config = {...new OptionsProvider(), ...config}
  }

  /**
  * Returns the template source instance to be used to get templates.
  * @param {?object} config - Scafflater configuration. If null, will get the default configuration.
  * @return {TemplateSource} An specialized instance of TemplateSource.
  */
  static getTemplateSource(config) {
    config = {...new OptionsProvider(), ...config}

    if (!config.sources[config.source]) {
      throw new Error(`There's no module for source '${config.source}'`)
    }
    
    return  new (require(config.sources[config.source]))(config)
  }

  /**
  * Gets the template and copies it in a local folder.
  * @param {string} sourceKey - The source key of template. Will vary, depending on template source
  * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
  * @return {object.path} path - Path where the template was copied.
  * @return {object.config} config - The template config.
  */
  async getTemplate(sourceKey, outputDir = null) {
    return TemplateSource.getTemplateSource()
    .getTemplate(sourceKey, outputDir)
  }
}

module.exports = TemplateSource
