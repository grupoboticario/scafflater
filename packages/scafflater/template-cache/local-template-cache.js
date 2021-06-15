const TemplateCache = require('./template-cache')
const os = require('os')
const path = require('path')
const FileSystemUtils = require('fs-util')
const sort = require('version-sort')

const defaultConfig = {
  localStorageTemplatesPath: path.join(os.homedir(), '.scafflater', 'templates'),
  templateConfigFileName: '_scf.json',
}

/**
* Stores templates in the local file system
* @extends TemplateCache
*/
class LocalTemplateStorage extends TemplateCache {
  constructor(config = {}) {
    super(config)
    this.config = {...defaultConfig, ...config}
  }

  /**
  * Stores the template in the local file system.
  * @param {string} templatePath - Path of template
  */
  async storeTemplate(templatePath) {
    const templateConfig = FileSystemUtils.getJson(path.join(templatePath, this.config.templateConfigFileName))
    const cachePath = path.join(this.config.localStorageTemplatesPath, templateConfig.name, templateConfig.version)
    FileSystemUtils.copy(templatePath, cachePath)
    return cachePath
  }

  /**
  *  Returns the template local path
  * @param {string} templateName - Template name
  * @param {string} templateVersion - Template Version. If null, the latest stored version is returned.
  * @returns {string} The path where template was copied. Returns null if the template is not in cache.
  */
  getTemplateFolder(templateName, templateVersion = null) {
    const templateFolder = path.join(this.config.localStorageTemplatesPath, templateName)

    if (!FileSystemUtils.pathExists(templateFolder)) {
      return null
    }

    if (!templateVersion) {
      let versions =  FileSystemUtils.getDirTree(templateFolder, false)

      // The template folder does not exist or there no versions on it
      if (!versions || versions.children.length <= 0)
        return null

      versions = sort(versions.children.map(d => d.name))
      templateVersion = versions[versions.length - 1]
    }

    const templateVersionFolder =  path.join(templateFolder, templateVersion)

    if (!FileSystemUtils.pathExists(templateVersionFolder)) {
      return null
    }

    return templateVersionFolder
  }

  /**
  * Gets the template path.
  * @param {string} templateName - Template name
  * @param {string} templateVersion - Template Version. If null, the latest stored version is returned.
  * @returns {string} The stored template path
  */
  async getTemplatePath(templateName, templateVersion = null) {
    return this.getTemplateFolder(templateName, templateVersion)
  }

  /**
  * Gets the cached template config.
  * @param {string} cacheKey - The cache key
  * @returns {object} The template config
  */
  async getTemplateConfig(cacheKey) {
    return FileSystemUtils.getJson(path.join(cacheKey, this.config.templateConfigFileName))
  }

  /**
  * List stored templates and their versions.
  */
  async listCachedTemplates() {
    const dirTree = FileSystemUtils.getDirTree(this.config.localStorageTemplatesPath, false)

    if (!dirTree)
      return null

    return dirTree.children.map(folder => {
      return {
        name: folder.name,
        versions: folder.children.map(v => {
          return {version: v.name}
        }),
      }
    })
  }
}

module.exports = LocalTemplateStorage
