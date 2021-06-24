const TemplateManager = require('./template-manager')
const Generator = require('./generator')
const fsUtil = require('./fs-util')
const path = require('path')
const ConfigProvider = require('./config-provider')

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
  * Initializes the basic structure for this scafflater template.
  * @param {string} sourceKey - Source Template key
  * @param {object} parameters - Parameters used to generate partials
  * @param {string} targetPath - Path where the results must be placed
  * @return {ReturnValueDataTypeHere} Brief description of the returning value here.
  */
  async init(sourceKey, parameters, targetPath = './') {
    const templateConfig = await this.templateManager.templateSource.getTemplate(sourceKey)

    const scfConfig = {
      template: { ...templateConfig.config },
      partials: [],
    }

    await fsUtil.writeJSON(path.resolve(targetPath, this.config.scfFileName), scfConfig)
    return this.runPartial('_init', parameters, targetPath, templateConfig,)
  }

  /** 
  * Brief description of the function here.
  * @summary If the description is long, write your summary here. Otherwise, feel free to remove this.
  * @param {ParamDataTypeHere} parameterNameHere - Brief description of the parameter here. Note: For other notations of data types, please refer to JSDocs: DataTypes command.
  * @return {Promise<string} Brief description of the returning value here.
  */
  async runPartial(partialPath, parameters, targetPath = './') {
    return new Promise(async (resolve, reject) => {
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
      const templateScf = await fsUtil.readJSON(path.join(templatePath, this.config.scfFileName))

      const ctx = {
        partial: partialInfo.config,
        partialPath: partialInfo.path,
        parameters,
        targetPath,
        template: templateScf,
        templatePath: templatePath,
        config: new ConfigProvider()
      }

      await new Generator(ctx).generate(ctx)

      if (!scfConfig.partials) {
        scfConfig.partials = []
      }

      scfConfig.partials.push({
        path: `${scfConfig.template.name}/${partialPath}`,
        parameters: parameters,
      })

      resolve(await fsUtil.writeJSON(path.join(targetPath, this.config.scfFileName), scfConfig))
    })
  }
}

module.exports = Scafflater
