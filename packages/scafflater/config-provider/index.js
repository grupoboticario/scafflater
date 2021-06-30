const path = require('path')
const fsUtil = require('../fs-util')

/**
 * @typedef {object} Config
 * @description The generation configuration
 */
class ConfigProvider {

  constructor() {
    this.singleLineComment = '#'
    this.startRegionMarker = '@scf-region'
    this.endRegionMarker = '@end-scf-region'
    this.configMarker = '@scf-config'
    // Can be handlebars
    this.targetName = null
    this.ignore = false
    this.annotate = true
    this.annotationTemplate = `{{{config.singleLineComment}}} {{{config.startRegionMarker}}}
{{{config.singleLineComment}}} This code was generated by scafflater
{{{config.singleLineComment}}} @template {{{template.name}}} (v{{{template.version}}})
{{{config.singleLineComment}}} @partial {{{partial.name}}}
{{#each parameters }}
{{{../config.singleLineComment}}} @{{{@key}}} {{{this}}} 
{{/each}}

{{{content}}}

{{{config.singleLineComment}}} {{{config.endRegionMarker}}}`

    this.processors = ['./processors/handlebars-processor']
    this.appenders = ['./appenders/region-appender', './appenders/appender']

    this.scfFileName = '_scf.json'
    this.partialsFolderName = '_partials'
    this.hooksFolderName = '_hooks'
    this.helpersFolderName = '_helpers'

    this.cacheStorage = 'tempDir'
    this.cacheStorages = {
      tempDir: './storages/temp-dir-cache',
      homeDir: './storages/home-dir-cache',
    }

    this.source = 'github'
    this.sources = {
      github: './git-template-source',
    }

    this.github_baseUrlApi = 'https://api.github.com'
    this.github_baseUrl = 'https://github.com'
    this.github_username = null
    this.github_password = null
  }

  static mergeFolderConfig(folderPath, config) {
    return new Promise(async (resolve, reject) => {
      try {
        let result = { ...config }
        const scfFilePath = path.join(folderPath, config.scfFileName)
        if (await fsUtil.pathExists(scfFilePath)) {
          const info = await fsUtil.readJSON(scfFilePath)
          if (info.config) {
            result = { ...result, ...info.config }
          }
        }
        resolve(result)
      } catch (error) {
        reject(error)
      }
    })
  }

  static extractConfigFromFileContent(filePath, config) {
    return new Promise(async (resolve, reject) => {
      try {
        let fileContent = await fsUtil.readFileContent(filePath)
        const configRegex = new RegExp(`.*${config.configMarker}\\s*(?<json>{.*}).*`, 'gi')
        const configs = fileContent.matchAll(configRegex)
        let newConfig = {}

        for (const c of configs) {
          try {
            newConfig = { ...newConfig, ...JSON.parse(c.groups.json) }
          } catch (error) {
            reject(new Error(`Could not parse option '${c.groups.name}' on file '${filePath}': ${error}`))
          }
        }

        resolve({
          config: { ...config, ...newConfig },
          fileContent: fileContent.replace(configRegex, '')
        })
      } catch (error) {
        reject(error)
      }
    })
  }
}

module.exports = ConfigProvider
