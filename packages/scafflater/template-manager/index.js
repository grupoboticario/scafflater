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
  * Gets the template from source and stores in the cache
  * @param {string} sourceKey - Teh source key
  * @return {object} An object containing template config
  */
  async getTemplateFromSource(sourceKey) {
    const tempTemplateFolder = await this.templateSource.getTemplate(sourceKey)
    const cachePath = await this.templateCache.storeTemplate(tempTemplateFolder.path)
    return fsUtil.readJSON(path.resolve(cachePath, this.config.scfFileName))
  }

  /**
  * Gets the template info
  * @param {string} sourceKey - Teh source key
  * @return {object} An object containing template config
  */
  async getTemplateInfo(templateName, templateVersion = null) {
    const templateFolder = await this.getTemplatePath(templateName, templateVersion)
    const templateInfo = await fsUtil.readJSON(path.resolve(templateFolder, this.config.scfFileName))
    templateInfo["path"] = templateFolder
    templateInfo.partials = []

    for (const partial of await this.listPartials(templateName, templateVersion)) {
      templateInfo.partials.push({
        ...partial.config,
        ...{ path: partial.path }
      })
    }

    return templateInfo;
  }

  /**
  * Gets the template path, if it is stored in the cache.
  * @param {string} templateName - Template name
  * @param {string} templateVersion - Template Version. If null, the latest stored version is returned.
  * @returns {Promise<string>} The cached template path. Returns null if the template is not in cache.
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
    return new Promise(async (resolve, reject) => {
      try {
        const partials = await this.listPartials(templateName, templateVersion)

        if (!partials) {
          resolve(null)
          return
        }

        const partial = partials.find(p => p.config.name === partialName)

        if (!partial) {
          resolve(null)
          return
        }

        resolve(partial)
      } catch (error) {
        reject(error)
      }
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
      try {
        const templatePath = await this.templateCache.getTemplatePath(templateName, templateVersion)
        if (!templatePath) {
          resolve(null)
          return
        }

        const partialsPath = path.join(templatePath, '_partials')
        const paths = await fsUtil.listFilesByNameDeeply(partialsPath, this.config.scfFileName)
        if (!paths) {
          resolve(null)
          return
        }

        const result = []
        for (const configPath of paths) {
          const config = await fsUtil.readJSON(configPath)
          if (config.type === 'partial') {
            result.push({
              config,
              path: path.dirname(configPath)
            })
          }
        }

        resolve(result)
      } catch (error) {
        reject(error)
      }
    })
  }
}

module.exports = TemplateManager
