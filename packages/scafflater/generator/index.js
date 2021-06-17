const path = require('path')
const Handlebars = require('handlebars')
const FileSystemUtils = require('../fs-util')
const Processor = require('./processors/processor')
const Appender = require('./appenders/appender')

/**
 * @typedef {object} Context
 * @description The context used by generator to generate files and folder structure
 * @property {object} partial The partial info
 * @property {string} partialPath The folder path to partial
 * @property {object} parameters The parameters to generate the partial
 * @property {string} targetPath The path where generated files and folders will be saved
 * @property {object} template The template info
 * @property {string} templatePath The folder path to template
 * @property {object} config The scafflater configuration. This is provided by ConfigProvider
 */
class Context{
  partial
  partialPath
  parameters
  targetPath
  template
  templatePath
  config
}

class Generator {
  
  /** 
  * Brief description of the function here.
  * @summary If the description is long, write your summary here. Otherwise, feel free to remove this.
  * @param {Context} context - The context to generate 
  * @return {ReturnValueDataTypeHere} Brief description of the returning value here.
  */
  constructor(context){
    this.context = context
    this.ignoredFiles = [context.config.scfFileName]
    this.ignoredFolders = [context.config.partialsFolderName, context.config.hooksFolderName]
    this.processors = context.config.processors.map(p => new (require(p))())
    this.appenders =  context.config.appenders.map(a => new (require(a))())
  }

  async generate() {
    // Loading handlebars js custom helper
    const helpersPath = path.join(this.context.templatePath, this.context.config.helpersFolderName)
    if (FileSystemUtils.pathExists(helpersPath)) {
      for (const js of await FileSystemUtils.listJsTreeInPath(helpersPath)) {
        const helperFunction = require(js)
        const helperName = path.basename(js, '.js')
        Handlebars.registerHelper(helperName, helperFunction)
      }
    }

    const tree = FileSystemUtils.getDirTree(this.context.partialPath)

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

  async _generate(ctx = {}, tree = null) {
    if (!tree)
      tree = FileSystemUtils.getDirTree(ctx.partialPath)

    const targetName = Processor.runProcessorsPipeline(this.processors, ctx, tree.name)
    if (targetName === '') {
      return
    }

    const promises = []
    if (tree.type === 'directory' && this.ignoredFolders.indexOf(tree.name) < 0) {
      for (const child of tree.children) {
        const _ctx = {
          ...ctx,
          ...{
            partialPath: path.join(ctx.partialPath, tree.name),
            targetPath: path.join(ctx.targetPath, targetName),
          },
        }
        promises.push(this._generate(_ctx, child))
      }
    }

    if (tree.type === 'file' && this.ignoredFiles.indexOf(tree.name) < 0) {
      let srcContent = FileSystemUtils.getFile(path.join(ctx.partialPath, tree.name))

      srcContent = Processor.runProcessorsPipeline(this.processors, ctx, srcContent)

      const targetPath = path.join(ctx.targetPath, targetName);
      let targetContent = ''
      if(FileSystemUtils.pathExists(targetPath)){
        targetContent = FileSystemUtils.getFile(targetPath)
      }

      const result = Appender.runAppendersPipeline(this.appenders, ctx, srcContent, targetContent)

      FileSystemUtils.saveFile(targetPath, result, false)
    }

    await Promise.all(promises)
  }

  static compileAndApply(ctx, templateStr) {
    return Handlebars.compile(templateStr)(ctx)
  }
}

module.exports = Generator
