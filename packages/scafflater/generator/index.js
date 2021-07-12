const path = require('path')
const Handlebars = require('handlebars')
const fsUtil = require('../fs-util')
const Processor = require('./processors/processor')
const Appender = require('./appenders/appender')
const ConfigProvider = require('../config-provider')
const HandlebarsProcessor = require('./processors/handlebars-processor')
const merge = require('deepmerge')

/**
 * @typedef {object} Context
 * @description The context used by generator to generate files and folder structure
 * @property {string} originPath The folder path to origin template files
 * @property {object} parameters The parameters to generate the output
 * @property {string} targetPath The path where generated files and folders will be saved
 * @property {string} helpersPath The folder with handlebars helpers implementations
 * @property {object} config The scafflater configuration. This is provided by ConfigProvider
 */

class Generator {

  /** 
  * Brief description of the function here.
  * @summary If the description is long, write your summary here. Otherwise, feel free to remove this.
  * @param {Context} context - The context to generate 
  * @return {ReturnValueDataTypeHere} Brief description of the returning value here.
  */
  constructor(context) {
    this.context = context
    this.ignoredFiles = [context.config.scfFileName]
    this.ignoredFolders = [
      context.config.partialsFolderName, 
      context.config.hooksFolderName, 
      context.config.helpersFolderName, 
      '.git']
    this.handlebarsProcessor = new HandlebarsProcessor()
  }

  async generate() {
    // Loading handlebars js custom helper
    await HandlebarsProcessor.loadHelpersFolder(this.context.helpersPath)

    const tree = fsUtil.getDirTreeSync(this.context.originPath)

    const promises = []
    if (tree.type === 'file') {
      promises.push(this._generate(this.context, tree))
    }

    if (tree.type === 'directory' && this.ignoredFolders.indexOf(tree.name) < 0) {
      for (const child of tree.children) {
        promises.push(this._generate(this.context, child))
      }
    }

    await Promise.all(promises)
  }

  async _generate(ctx, tree) {

    let targetName = Processor.runProcessorsPipeline([this.handlebarsProcessor], ctx, tree.name)
    if (targetName === '') {
      return
    }

    const promises = []
    if (tree.type === 'directory' && this.ignoredFolders.indexOf(tree.name) < 0) {
      const dirPath = path.join(ctx.originPath, tree.name)
      const dirConfig = await ConfigProvider.mergeFolderConfig(dirPath, this.context.config)
      for (const child of tree.children) {
        const _ctx = {
          ...ctx,
          ...{
            originPath: path.join(dirPath),
            targetPath: path.join(ctx.targetPath, targetName),
            config: dirConfig
          },
        }
        promises.push(this._generate(_ctx, child))
      }
    }

    if (tree.type === 'file' && this.ignoredFiles.indexOf(tree.name) < 0) {
      const filePath = path.join(ctx.originPath, tree.name)
      const configFromFile = await ConfigProvider.extractConfigFromFileContent(filePath, this.context.config)
      const _ctx = { ...ctx }
      _ctx.config = configFromFile.config

      if (!_ctx.config.ignore) {
        if(_ctx.config.targetName || _ctx.config.targetName === ''){
          targetName = Processor.runProcessorsPipeline([this.handlebarsProcessor], ctx, _ctx.config.targetName)
        }
        if (targetName === '') {
          return
        }

        const processors = _ctx.config.processors.map(p => new (require(p))())
        let srcContent = Processor.runProcessorsPipeline(processors, _ctx, configFromFile.fileContent)

        const targetPath = path.join(ctx.targetPath, targetName);
        let targetContent = ''
        if (await fsUtil.pathExists(targetPath)) {
          targetContent = await fsUtil.readFileContent(targetPath)
        }

        const appenders = _ctx.config.appenders.map(a => new (require(a))())
        const result = await Appender.runAppendersPipeline(appenders, _ctx, srcContent, targetContent)

        promises.push(fsUtil.saveFile(targetPath, await ConfigProvider.removeConfigFromString(result, _ctx.config), false))
      }
    }

    return Promise.all(promises)
  }
}

module.exports = Generator
