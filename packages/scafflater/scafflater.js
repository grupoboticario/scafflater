const TemplateManager = require('./template-manager')
const Generator = require('./generator')
const fsUtil = require('./fs-util')
const path = require('path')
const ConfigProvider = require('./config-provider')
const { maskParameters } = require('./util')

/**
* Scafflater class
*/
class Scafflater {
  /**
  * Scafflater constructor.
  * @param {?object} config - Scafflater configuration. If null, will get the default configuration.
  * @param {string} sourceKey - The source key
  */
  constructor(config = {}, templateManager = null) {
    this.config = { ...new ConfigProvider(), ...config }
    this.templateManager = templateManager ?? new TemplateManager(this.config)
  }

  /** 
  * Run scafflater
  * @param {ParamDataTypeHere} parameterNameHere - Brief description of the parameter here. Note: For other notations of data types, please refer to JSDocs: DataTypes command.
  * @return {Promise<string} Brief description of the returning value here.
  */
  async run(originPath, parameters, templatePath, targetPath = './', ctx = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const config = {
          ...this.config,
          ...ctx.config
        }

        const helpersPath = path.resolve(templatePath, config.helpersFolderName)
        const hooksPath = path.resolve(templatePath, config.hooksFolderName)
        
        const _ctx = {
          ...ctx,
          ...{
            originPath,
            parameters,
            targetPath,
            helpersPath,
            hooksPath,
            config
          }
        }

        await new Generator(_ctx).generate()

        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
  * Initializes the basic structure for this scafflater template.
  * @param {string} sourceKey - Source Template key
  * @param {object} parameters - Parameters used to generate partials
  * @param {string} targetPath - Path where the results must be placed
  * @return {ReturnValueDataTypeHere} Brief description of the returning value here.
  */
  async init(sourceKey, parameters, targetPath = './') {
    return new Promise(async (resolve, reject) => {
      try {
        const { path: templatePath, config } = await this.templateManager.templateSource.getTemplate(sourceKey)

        const maskedParameters = maskParameters(parameters, config.parameters)

        const targetInfo = {
          template: {
            name: config.name,
            version: config.version,
            source: { ...config.source }
          },
          parameters: maskedParameters,
          partials: [],
        }

        const ctx = {
          template: await this.templateManager.getTemplateInfo(config.name, config.version),
          target: targetInfo
        }

        await this.run(templatePath, parameters, templatePath, targetPath, ctx)

        const scfFile = path.resolve(targetPath, this.config.scfFileName)
        if (!fsUtil.pathExists(scfFile)) {
          // If the file already exists, it means that the template generate one config file. Must not override.
          await fsUtil.writeJSON(scfFile, targetInfo)
        }
        resolve(scfFile)
      } catch (error) {
        reject(error)
      }
    })
  }

  /** 
  * Brief description of the function here.
  * @summary If the description is long, write your summary here. Otherwise, feel free to remove this.
  * @param {ParamDataTypeHere} parameterNameHere - Brief description of the parameter here. Note: For other notations of data types, please refer to JSDocs: DataTypes command.
  * @return {Promise<string} Brief description of the returning value here.
  */
  async runPartial(partialPath, parameters, targetPath = './') {
    return new Promise(async (resolve, reject) => {
      try {
        const targetInfo = await fsUtil.readJSON(path.join(targetPath, this.config.scfFileName))

        let partialInfo = await this.templateManager.getPartial(partialPath, targetInfo.template.name, targetInfo.template.version)

        if (!partialInfo) {
          // Trying to get the template
          // TODO: Get template by version
          await this.templateManager.getTemplateFromSource(targetInfo.template.source.key)
          partialInfo = await this.templateManager.getPartial(partialPath, targetInfo.template.name, targetInfo.template.version)
          if (!partialInfo) {
            resolve(null)
            return
          }
        }

        const templatePath = await this.templateManager.getTemplatePath(targetInfo.template.name, targetInfo.template.version)
        const templateInfo = await this.templateManager.getTemplateInfo(targetInfo.template.name, targetInfo.template.version)

        const ctx = {
          partial: partialInfo.config,
          template: templateInfo,
          templatePath,
          target: targetInfo
        }

        await this.run(partialInfo.path, parameters, templatePath, targetPath, ctx)

        if (!targetInfo.partials) {
          targetInfo.partials = []
        }

        const maskedParameters = maskParameters(parameters, partialInfo.config.parameters)

        if (partialInfo.config.options?.logRun == null ||
          partialInfo.config.options?.logRun == undefined ||
          partialInfo.config.options?.logRun) {
          targetInfo.partials.push({
            path: `${targetInfo.template.name}/${partialPath}`,
            parameters: maskedParameters,
          })
        }

        resolve(await fsUtil.writeJSON(path.join(targetPath, this.config.scfFileName), targetInfo))
      } catch (error) {
        reject(error)
      }
    })
  }
}

module.exports = Scafflater
