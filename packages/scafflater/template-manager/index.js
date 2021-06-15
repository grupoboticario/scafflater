const path = require('path')
const FileSystemUtils = require('../fs-util')

/**
* Template Manager factory.
*/
class TemplateManager {
  /**
  * Template Manager constructor.
  * @param {TemplateSource} templateSource - The template source
  * @param {TemplateCache} templateCache - The template cache
  */
  constructor(templateSource, templateCache) {
    /** @constant {TemplateSource} */
    this.templateSource = templateSource
    /** @constant {TemplateCache} */
    this.templateCache = templateCache
  }

  /**
  * Gets teh template from source and stores in the cache
  * @param {string} sourceKey - Teh source key
  * @return {object} An object containing template config
  */
  async getTemplateFromSource(sourceKey) {
    const tempTemplateFolder =  await this.templateSource.getTemplate(sourceKey)
    const cacheKey = await this.templateCache.storeTemplate(tempTemplateFolder.path)
    return this.templateCache.getTemplateConfig(cacheKey)
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
    const partials = await this.listPartials(templateName, templateVersion)

    if (!partials)
      return null

    const partial = partials.find(p => p.config.name === partialName)

    if (!partial)
      return null

    return partial
  }

  /**
  * List avaiable partials in template.
  * @param {string} templateName - Template name
  * @param {string} templateVersion - Template Version. If null, the latest stored version is returned.
  * @returns {object[]} Array of objects containing the config and the path to partial.
  */
  async listPartials(templateName, templateVersion = null) {
    const templatePath = await this.templateCache.getTemplatePath(templateName, templateVersion)
    if (!templatePath)
      return null

    const partialsPath = path.join(templatePath, '_partials')
    const configs = await FileSystemUtils.listScfConfigTreeInPath(partialsPath)
    if (!configs)
      return null

    const result = []
    for (const config of configs) {
      result.push({
        // eslint-disable-next-line no-await-in-loop
        config: await FileSystemUtils.getJson(config),
        path: path.dirname(config),
      })
    }

    return result
  }
}

module.exports = TemplateManager
