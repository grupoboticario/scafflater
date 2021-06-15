const path = require('path')
const Handlebars = require('handlebars')
const FileSystemUtils = require('fs-util')
const HandlebarsProcessor = require('./processors/handlebars-processor')
const Processor = require('./processors/processor')
const Appender = require('./appenders/appender')

// TODO: mover para configurações

const ignoredFiles = ['_scf.json']
const ignoredFolders = ['_partials, _hooks']
const processors = [ new HandlebarsProcessor() ]
const appenders = [ new Appender() ]

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
  }

  async generate() {
    // Loading handlebars js custom helper
    const helpersPath = path.join(this.context.templatePath, '_helpers')
    if (FileSystemUtils.pathExists(helpersPath)) {
      for (const js of await FileSystemUtils.listJsTreeInPath(helpersPath)) {
        const helperFunction = require(js)
        const helperName = path.basename(js, '.js')
        Handlebars.registerHelper(helperName, helperFunction)
      }
    }

    const tree = FileSystemUtils.getDirTree(this.context.partialPath)

    const promisses = []
    if (tree.type === 'file') {
      promisses.push(this._generate(this.context, tree))
    }

    if (tree.type === 'directory' && ignoredFolders.indexOf(tree.name) < 0) {
      for (const child of tree.children) {
        promisses.push(this._generate(this.context, child))
      }
    }

    await Promise.all(promisses)
  }

  async _generate(ctx = {}, tree = null) {
    if (!tree)
      tree = FileSystemUtils.getDirTree(ctx.partialPath)

    const targetName = Processor.runProcessorsPipeline(processors, ctx, tree.name)
    if (targetName === '') {
      return
    }

    const promisses = []
    if (tree.type === 'directory' && ignoredFolders.indexOf(tree.name) < 0) {
      for (const child of tree.children) {
        const _ctx = {
          ...ctx,
          ...{
            partialPath: path.join(ctx.partialPath, tree.name),
            targetPath: path.join(ctx.targetPath, targetName),
          },
        }
        promisses.push(this._generate(_ctx, child))
      }
    }

    if (tree.type === 'file' && ignoredFiles.indexOf(tree.name) < 0) {
      let srcContent = FileSystemUtils.getFile(path.join(ctx.partialPath, tree.name))

      srcContent = Processor.runProcessorsPipeline(processors, ctx, srcContent)

      const targetPath = path.join(ctx.targetPath, targetName);
      let targetContent = ''
      if(FileSystemUtils.pathExists(targetPath)){
        targetContent = FileSystemUtils.getFile(targetPath)
      }

      const result = Appender.runAppendersPipeline(appenders, ctx, srcContent, targetContent)

      FileSystemUtils.saveFile(targetPath, result, false)
    }

    await Promise.all(promisses)
  }

  static compileAndApply(ctx, templateStr) {
    return Handlebars.compile(templateStr)(ctx)
  }
}

module.exports = Generator
