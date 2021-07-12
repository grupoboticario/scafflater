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
  constructor(config = {}) {
    this.config = { ...new ConfigProvider(), ...config }
    this.templateManager = new TemplateManager(this.config)
  }

  /** 
  * Run scafflater
  * @param {ParamDataTypeHere} parameterNameHere - Brief description of the parameter here. Note: For other notations of data types, please refer to JSDocs: DataTypes command.
  * @return {Promise<string} Brief description of the returning value here.
  */
  async run(originPath, parameters, targetPath = './', ctx = {}, helpersPath = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const _ctx = {
          ...ctx,
          ...{
            originPath,
            parameters,
            targetPath,
            helpersPath,
            config: {
              ...this.config,
              ...ctx.config
            }
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

        const scfConfig = {
          template: {
            name: config.name,
            version: config.version,
            source: { ...config.source}
          },
          parameters: maskedParameters,
          partials: [],
        }

        const ctx = {
          template: await this.templateManager.getTemplateInfo(config.name, config.version),
          templatePath
        }
        const helpersPath = path.resolve(templatePath, this.config.helpersFolderName)

        await this.run(templatePath, parameters, targetPath, ctx, helpersPath)

        const scfFile = path.resolve(targetPath, this.config.scfFileName)
        if (!fsUtil.pathExists(scfFile)){
          // If the file already exists, it means that the template generate one config file. Must not override.
          await fsUtil.writeJSON(scfFile, scfConfig)
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
        const scfConfig = await fsUtil.readJSON(path.join(targetPath, this.config.scfFileName))

        let partialInfo = await this.templateManager.getPartial(partialPath, scfConfig.template.name, scfConfig.template.version)

        if (!partialInfo) {
          // Trying to get the template
          // TODO: Get template by version
          await this.templateManager.getTemplateFromSource(scfConfig.template.source.key)
          partialInfo = await this.templateManager.getPartial(partialPath, scfConfig.template.name, scfConfig.template.version)
          if (!partialInfo) {
            resolve(null)
            return
          }
        }

        const templatePath = await this.templateManager.getTemplatePath(scfConfig.template.name, scfConfig.template.version)
        const templateInfo = await this.templateManager.getTemplateInfo(scfConfig.template.name, scfConfig.template.version)
        const helpersPath = path.resolve(templatePath, this.config.helpersFolderName)

        const ctx = {
          partial: partialInfo.config,
          template: templateInfo
        }

        await this.run(partialInfo.path, parameters, targetPath, ctx, helpersPath)

        if (!scfConfig.partials) {
          scfConfig.partials = []
        }

        const maskedParameters = maskParameters(parameters, partialInfo.config.parameters)

        scfConfig.partials.push({
          path: `${scfConfig.template.name}/${partialPath}`,
          parameters: maskedParameters,
        })

        resolve(await fsUtil.writeJSON(path.join(targetPath, this.config.scfFileName), scfConfig))
      } catch (error) {
        reject(error)
      }
    })
  }
}

module.exports = Scafflater
