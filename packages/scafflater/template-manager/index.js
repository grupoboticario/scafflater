const path = require('path')
const fsUtil = require('../fs-util')
const TemplateCache = require('../template-cache')
const TemplateSource = require('../template-source')

/**
* Template Manager factory.
*/
class TemplateManager {
  /**
  * Template Manager constructor.
  * @param {object} config - Config
  */
  constructor(config) {
    this.config = config
    /** @constant {TemplateSource} */
    this.templateSource = TemplateSource.getTemplateSource(config)
    /** @constant {TemplateCache} */
    this.templateCache = TemplateCache.getTemplateCache(config)
  }

  /**
  * Gets teh template from source and stores in the cache
  * @param {string} sourceKey - Teh source key
  * @return {object} An object containing template config
  */
  async getTemplateFromSource(sourceKey) {
    const tempTemplateFolder = await this.templateSource.getTemplate(sourceKey)
    const cachePath = await this.templateCache.storeTemplate(tempTemplateFolder.path)
    return fsUtil.readJSON(path.resolve(cachePath, this.config.scfFileName))
  }

  /**
  * Gets the template path, if it is stored in the cache.
  * @param {string} templateName - Template name
  * @param {string} templateVersion - Template Version. If null, the latest stored version is returned.
  * @returns {string} The cached template path. Returns null if the template is not in cache.
  */
  async getTemplatePath(templateName, templateVersion = null) {
    return this.templateCache.getTemplatePath(templateName, templateVersion)
  }

  /**
  * Gets the partial path, if it is stored in the cache.
  * @param {string} partialName - Partial name
  * @param {string} templateName - Template name
  * @param {string} templateVersion - Template Version. If null, the latest stored version is returned.
  * @returns {object} Object containing the config and the path to partial.
  */
  async getPartial(partialName, templateName, templateVersion = null) {
    return new Promise((resolve, reject) => {
      const partials = await this.listPartials(templateName, templateVersion)

      if (!partials){
        resolve(null)
        return
      }

      const partial = partials.find(p => p.config.name === partialName)

      if (!partial){
        resolve(null)
        return
      }

      resolve(partial)
    })
  }

  /**
  * List available partials in template.
  * @param {string} templateName - Template name
  * @param {string} templateVersion - Template Version. If null, the latest stored version is returned.
  * @returns {Promise<object[]>} Array of objects containing the config and the path to partial.
  */
  async listPartials(templateName, templateVersion = null) {
    return new Promise(async (resolve, reject) => {
      const templatePath = await this.templateCache.getTemplatePath(templateName, templateVersion)
      if (!templatePath) {
        resolve(null)
        return
      }

      const partialsPath = path.join(templatePath, '_partials')
      const configs = await fsUtil.listFilesByNameDeeply(partialsPath, this.config.scfFileName)
      if (!configs) {
        resolve(null)
        return
      }

      const result = []
      for (const config of configs) {
        result.push({
          // eslint-disable-next-line no-await-in-loop
          config: fsUtil.readJSONSync(config),
          path: path.dirname(config),
        })
      }

      resolve(result)

    })
  }
}

module.exports = TemplateManager
