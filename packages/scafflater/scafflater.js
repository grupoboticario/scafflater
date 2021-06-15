const TemplateSource = require('./template-source')
const TemplateCache = require('./template-cache')
const TemplateManager = require('./template-manager')
const Generator = require('./generator')
const FileSystemUtils = require('./fs-util')
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
  constructor(config = {}, sourceKey = null) {
    this.config = config
    this.templateSource = new TemplateSource(this.config, sourceKey)
    this.templateCache = new TemplateCache(this.config)
    this.templateManager = new TemplateManager(this.templateSource, this.templateCache)
  }

  buildContext(config, parameters, sourcePath, targetPath) {
    return {
      config,
      parameters,
      sourcePath,
      targetPath,
    }
  }

  /**
  * Initializes the basic structure for this scafflater template.
  * @param {string} sourceKey - Source Template key
  * @param {object} parameters - Parameters used to generate partials
  * @param {string} targetPath - Path where the results must be placed
  * @return {ReturnValueDataTypeHere} Brief description of the returning value here.
  */
  async init(sourceKey, parameters, targetPath = './') {
    const templateConfig = await this.templateSource.getTemplate(sourceKey)

    const scfConfig = {
      template: {...templateConfig.config},
      partials: [],
    }

    FileSystemUtils.saveJson(path.join(targetPath, '_scf.json'), scfConfig)

    await this.runPartial('_init', parameters, targetPath, templateConfig,)
  }

  async runPartial(partialPath, parameters, targetPath = './') {
    const scfConfig = await FileSystemUtils.getJson(path.join(targetPath, '_scf.json'))

    const partialInfo = await this.templateManager.getPartial(partialPath, scfConfig.template.name, scfConfig.template.version)

    const templatePath = await this.templateManager.getTemplatePath(scfConfig.template.name, scfConfig.template.version)
    const templateScf = FileSystemUtils.getJson(path.join(templatePath, '_scf.json'))
    // const ctx = this.buildContext(partialInfo.config, parameters, partialInfo.path, targetPath)

    const ctx = {
      partial: partialInfo.config,
      partialPath: partialInfo.path,
      parameters,
      targetPath,
      template: templateScf,
      templatePath: templatePath,
      config: new ConfigProvider()
    }

    await  new Generator(ctx).generate(ctx)

    scfConfig.partials.push({
      path: `${scfConfig.template.name}/${partialPath}`,
      parameters: parameters,
    })

    FileSystemUtils.saveJson(path.join(targetPath, '_scf.json'), scfConfig)
  }
}

module.exports = Scafflater
