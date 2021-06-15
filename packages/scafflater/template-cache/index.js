
const defaultConfig = {
  storage: 'local',
  storages: {
    local: './local-template-cache',
  },
}

/**
* TemplateStorage factory.
*/
class TemplateCache {
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
  * @param {?string} storage - Storage to be used. If null, will use local as default.
  * @return {TemplateCache} An specialized instance of TemplateStorage.
  */
  getTemplateCache(config = {}, storage = null) {
    const c = {...defaultConfig, ...config}
    const s = storage ? storage : c.storage

    if (!c.storages[s]) {
      throw new Error(`There's no module for source '${s}'`)
    }

    const ts = new (require(c.storages[s]))(config)
    return ts
  }

  /**
  * Stores the template.
  * @param {string} path - Path of template
  * @returns {string} The cache key
  */
  async storeTemplate(path) {
    return this
    .getTemplateCache()
    .storeTemplate(path)
  }

  /**
  * Gets the template path.
  * @param {string} templateName - Template name
  * @param {string} templateVersion - Template Version. If null, the latest stored version is returned.
  * @returns {string} The template path
  */
  async getTemplatePath(templateName, templateVersion = null) {
    return this
    .getTemplateCache()
    .getTemplatePath(templateName, templateVersion)
  }

  /**
  * Gets the cached template config.
  * @param {string} cacheKey - The cache key
  * @returns {object} The template config
  */
  async getTemplateConfig(cacheKey) {
    return this
    .getTemplateCache()
    .getTemplateConfig(cacheKey)
  }

  /**
  * List stored templates and their versions.
  * @param {string} templateName - Template name
  * @param {string} templateVersion - Template Version. If null, the latest stored version is returned.
  * @param {string} path - Path to output the template If null, will store the template in a temp folder.
  */
  async listCachedTemplates() {
    return this
    .getTemplateCache()
    .listCachedTemplates()
  }
}

module.exports = TemplateCache
