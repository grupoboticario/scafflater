const path = require('path')
const fsUtil = require('../fs-util')
const Processor = require('./processors/processor')
const Appender = require('./appenders/appender')
const OptionsProvider = require('../options-provider')
const HandlebarsProcessor = require('./processors/handlebars-processor')

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
    this.context.targetPath = path.resolve(context.targetPath)
    this.ignoredFiles = [context.config.scfFileName]
    this.ignoredFolders = [
      context.config.partialsFolderName,
      context.config.hooksFolderName,
      context.config.helpersFolderName,
      '.git',
      'node_modules']
    this.handlebarsProcessor = new HandlebarsProcessor()
    this.hooks = {}
  }

  async loadHooks() {
    if (!this.context.hooksPath || !await fsUtil.pathExists(this.context.hooksPath)) {
      return
    }

    for (const js of await fsUtil.listFilesByExtensionDeeply(this.context.hooksPath, 'js')) {
      try {
        const hookFunction = fsUtil.require(js)
        const hookName = path.basename(js, '.js')
        this.hooks[hookName] = hookFunction
      } catch (error) {
        // TODO: How to feedback the user in a better way?
        continue
      }
    }
  }

  async generate() {
    this.hooks = await fsUtil.loadScriptsAsObjects(this.context.hooksPath, true)

    if (this.hooks.onGenerateStart) {
      this.context = await this.hooks.onGenerateStart(this.context)
    }

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
    
    if ((tree.type === 'directory' && this.ignoredFolders.indexOf(tree.name) >= 0) ||
      (tree.type === 'file' && this.ignoredFiles.indexOf(tree.name) >= 0)) {
      return Promise.resolve()
    }

    const config = await this.loadConfig(tree, ctx)

    if (config.ignore) {
      return Promise.resolve()
    }

    let targetName = tree.name
    if (config.targetName != null) {
      targetName = config.targetName
    }
    targetName = Processor.runProcessorsPipeline([this.handlebarsProcessor], ctx, targetName)
    if (targetName === '') {
      return Promise.resolve()
    }

    const _ctx = {
      ...ctx,
      ...{
        originPath: path.join(ctx.originPath, tree.name),
        targetPath: path.join(ctx.targetPath, targetName),
        config: config
      }
    }

    const promises = []
    if (tree.type === 'directory') {
      for (const child of tree.children) {
        // Removing target name from context. 
        // The intens inside this folder must not be affected by this config.
        _ctx.config.targetName = null
        promises.push(this._generate(_ctx, child))
      }
    }

    if (tree.type === 'file') {
      const filePath = path.join(ctx.originPath, tree.name)
      const fileContent = await fsUtil.readFileContent(filePath)

      const processors = _ctx.config.processors.map(p => new (require(p))())
      let srcContent = Processor.runProcessorsPipeline(processors, _ctx, fileContent)

      const targetPath = path.join(ctx.targetPath, targetName);
      let targetContent = ''
      if (await fsUtil.pathExists(targetPath)) {
        targetContent = await fsUtil.readFileContent(targetPath)
      }

      const appenders = _ctx.config.appenders.map(a => new (require(a))())
      const result = await Appender.runAppendersPipeline(appenders, _ctx, srcContent, targetContent)

      promises.push(fsUtil.saveFile(targetPath, await OptionsProvider.removeConfigFromString(result, _ctx.config), false))

    }

    return Promise.all(promises)
  }

  /** 
  * Loads and merge the config of file or folder with the context config
  * @param {object} tree 
  * @param {Context} context
  * @return {Promise<ConfigProvider>} Brief description of the returning value here.
  */
  async loadConfig(tree, context) {
    if (tree.type === 'directory') {
      const dirPath = path.join(context.originPath, tree.name)
      return OptionsProvider.mergeFolderConfig(dirPath, context.config)
    }

    if (tree.type === 'file') {
      const filePath = path.join(context.originPath, tree.name)
      return OptionsProvider.extractConfigFromFileContent(filePath, context.config)
    }
  }
}

module.exports = Generator
