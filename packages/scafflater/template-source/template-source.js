
const defaultConfig = {
  source: 'github',
  sources: {
    github: './git-template-source',
  },
}

/**
* TemplateSource factory.
*/
class TemplateSource {
  /**
  * Template Source constructor.
  * @param {?object} config - Scafflater configuration. If null, will get the default configuration.
  */
  constructor(config = {}) {
    this.config = {...defaultConfig, ...config}
  }

  /**
  * Returns the template source instance to be used to get templates.
  * @param {?object} config - Scafflater configuration. If null, will get the default configuration.
  * @return {TemplateSource} An specialized instance of TemplateSource.
  */
  getTemplateSource() {
    if (!this.config.sources[this.config.source]) {
      throw new Error(`There's no module for source '${this.config.source}'`)
    }

    const ts = new (require(this.config.sources[this.config.source]))(this.config)
    return ts
  }

  /**
  * Gets the template and copies it in a local folder.
  * @param {string} sourceKey - The source key of template. Will vary, depending on template source
  * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
  * @return {object.path} path - Path where the template was copied.
  * @return {object.config} config - The template config.
  */
  async getTemplate(sourceKey, outputDir = null) {
    return this
    .getTemplateSource()
    .getTemplate(sourceKey, outputDir)
  }
}

module.exports = TemplateSource
