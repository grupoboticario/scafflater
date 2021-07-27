const path = require("path");
const fsUtil = require("../fs-util");
const Processor = require("./processors/processor");
const Appender = require("./appenders/appender");
const HandlebarsProcessor = require("./processors/handlebars-processor");
const prettier = require("prettier");
const ScafflaterOptions = require("../options");
const { isBinaryFile } = require("isbinaryfile");

/**
 * @typedef {object} Context
 * @description The context used by generator to generate files and folder structure
 * @property {string} originPath The folder path to origin template files
 * @property {object} parameters The parameters to generate the output
 * @property {string} targetPath The path where generated files and folders will be saved
 * @property {string} helpersPath The folder with handlebars helpers implementations
 * @property {ScafflaterOptions} options The scafflater options.
 */

class Generator {
  /**
   * Brief description of the function here.
   *
   * @summary If the description is long, write your summary here. Otherwise, feel free to remove this.
   * @param {object} context - The context to generate
   */
  constructor(context) {
    this.context = context;
    this.context.targetPath = path.resolve(context.targetPath);
    this.ignoredFiles = [context.options.scfFileName];
    this.ignoredFolders = [
      path.resolve(context.templatePath, context.options.partialsFolderName),
      path.resolve(context.templatePath, context.options.hooksFolderName),
      path.resolve(context.templatePath, context.options.helpersFolderName),
      ".git",
      "node_modules",
    ];
    this.handlebarsProcessor = new HandlebarsProcessor();
    this.hooks = {};
  }

  async generate() {
    this.hooks = await fsUtil.loadScriptsAsObjects(
      this.context.hooksPath,
      true
    );

    if (this.hooks.onGenerateStart) {
      await this.hooks.onGenerateStart(this.context);
    }

    // Loading handlebars js custom helper
    await HandlebarsProcessor.loadHelpersFolder(this.context.helpersPath);

    const tree = fsUtil.getDirTreeSync(this.context.originPath);

    const promises = [];
    if (tree.type === "file") {
      promises.push(this._generate(this.context, tree));
    }

    if (
      tree.type === "directory" &&
      this.ignoredFolders.indexOf(tree.name) < 0
    ) {
      for (const child of tree.children) {
        promises.push(this._generate(this.context, child));
      }
    }

    await Promise.all(promises);
  }

  async _generate(ctx, tree) {
    if (
      (tree.type === "directory" &&
        this.ignoredFolders.indexOf(tree.path) >= 0) ||
      (tree.type === "file" && this.ignoredFiles.indexOf(tree.name) >= 0)
    ) {
      return Promise.resolve();
    }

    const options = await this.loadOptions(tree, ctx);

    if (options.ignores(ctx.originPath, tree.path)) {
      return Promise.resolve();
    }

    let targetName = tree.name;
    if (options.targetName != null) {
      targetName = options.targetName;
    }
    targetName = Processor.runProcessorsPipeline(
      [this.handlebarsProcessor],
      ctx,
      targetName
    );
    if (targetName === "") {
      return Promise.resolve();
    }

    const _ctx = {
      ...ctx,
      ...{
        originPath: path.join(ctx.originPath, tree.name),
        targetPath: path.join(ctx.targetPath, targetName),
        options,
      },
    };

    const promises = [];
    if (tree.type === "directory") {
      for (const child of tree.children) {
        // Removing target name from context.
        // The intens inside this folder must not be affected by this config.
        _ctx.options.targetName = null;
        promises.push(this._generate(_ctx, child));
      }
    }

    if (tree.type === "file") {
      const filePath = path.join(ctx.originPath, tree.name);

      const targetPath = path.join(ctx.targetPath, targetName);
      let targetContent = "";
      if (await fsUtil.pathExists(targetPath)) {
        targetContent = await fsUtil.readFileContent(targetPath);
      }

      if (!(await isBinaryFile(filePath))) {
        const fileContent = await fsUtil.readFileContent(filePath);

        const processors = _ctx.options.processors.map(
          (p) => new (require(p))()
        );
        const srcContent = Processor.runProcessorsPipeline(
          processors,
          _ctx,
          fileContent
        );

        const appenders = _ctx.options.appenders.map((a) => new (require(a))());
        let result = await Appender.runAppendersPipeline(
          appenders,
          _ctx,
          srcContent,
          targetContent
        );

        result = _ctx.options.stripConfig(result);

        try {
          result = prettier.format(result, { filepath: targetPath });
        } catch (error) {
          // Just to quiet prettier errors
        }

        promises.push(fsUtil.saveFile(targetPath, result, false));
      } else {
        await fsUtil.ensureDir(path.dirname(targetPath));
        promises.push(fsUtil.copyFile(filePath, targetPath));
      }
    }

    return Promise.all(promises);
  }

  /**
   * Loads and merge the options of file or folder with the context options
   *
   * @param {object} tree The directory item to load options
   * @param {Context} context The context to load options
   * @returns {Promise<ScafflaterOptions>} Brief description of the returning value here.
   */
  async loadOptions(tree, context) {
    if (tree.type === "directory") {
      const dirPath = path.join(context.originPath, tree.name);
      return context.options.getFolderOptions(dirPath, context.options);
    }

    if (tree.type === "file") {
      const filePath = path.join(context.originPath, tree.name);
      return context.options.getFileOptions(filePath, context.options);
    }
  }
}

module.exports = Generator;
