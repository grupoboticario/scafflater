const TemplateCache = require('..')
const path = require('path')
const fsUtil = require('../../fs-util')
const sort = require('version-sort')
const ConfigProvider = require('../../config-provider')

/**
* Stores templates in the local file system
* @extends TemplateCache
*/
class DirCache extends TemplateCache {
  constructor(storagePath, config = {}) {
    config = { ...new ConfigProvider(), ...config }
    super(config)
    this.storagePath = storagePath
    this.config = config
  }

  /**
  * Stores the template in the local file system.
  * @param {string} templatePath - Path of template
  * @returns {Promise<string>} The path where template was cached.
  */
  storeTemplate(templatePath) {
    return new Promise(async (resolve, reject) => {
      const templateConfig = await fsUtil.readJSON(path.join(templatePath, this.config.scfFileName))
      const cachePath = path.join(this.storagePath, templateConfig.name, templateConfig.version)
      await fsUtil.copyEnsuringDest(templatePath, cachePath)
      resolve(cachePath)
    })
  }

  /**
  *  Returns the template local path
  * @param {string} templateName - Template name
  * @param {string} templateVersion - Template Version. If null, the latest stored version is returned.
  * @returns {Promise<string>} The path where template was copied. Returns null if the template is not in cache.
  */
  async getTemplatePath(templateName, templateVersion = null) {
    return new Promise(async (resolve, reject) => {
      const templateFolder = path.join(this.storagePath, templateName)

      if (!await fsUtil.pathExists(templateFolder)) {
        resolve(null)
        return
      }

      if (!templateVersion) {
        let versions = fsUtil.getDirTreeSync(templateFolder, false)

        // The template folder does not exist or there no versions on it
        if (!versions || versions.children.length <= 0) {
          resolve(null)
          return
        }

        versions = sort(versions.children.map(d => d.name))
        templateVersion = versions[versions.length - 1]
      }

      const templateVersionFolder = path.join(templateFolder, templateVersion)

      if (!await fsUtil.pathExists(templateVersionFolder)) {
        resolve(null)
        return
      }

      resolve(templateVersionFolder)
    })
  }

  /**
  * List stored templates and their versions.
  */
  listCachedTemplates() {
    return new Promise((resolve, reject) => {
      const dirTree = fsUtil.getDirTreeSync(this.storagePath, false)

      if (!dirTree)
        resolve(null)

      resolve(dirTree.children.map(folder => {
        return {
          name: folder.name,
          versions: folder.children.map(v => {
            return { version: v.name }
          }),
        }
      }))
    })
  }
}

module.exports = DirCache
