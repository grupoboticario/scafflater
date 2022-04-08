const path = require("path");
const fsUtil = require("../fs-util");
const Processors = require("./processors");
const Appenders = require("./appenders");
const HandlebarsProcessor = require("./processors/handlebars-processor");
const prettier = require("prettier");
const ScafflaterOptions = require("../options");
const { isBinaryFile } = require("isbinaryfile");
const { ignores } = require("../util");

/**
 * Helper to execute Promises
 */
class PromisesHelper {
  constructor() {
    this.promises = [];
  }

  async exec(ctx, promise) {
    if (ctx.mode === "debug") {
      await promise;
    } else {
      this.promises.push(promise);
    }
  }

  async await() {
    return Promise.all(this.promises);
  }
}

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
    this.ignoredPatterns = [
      `**/${this.context.options.scfFileName}`,
      `/${this.context.options.initFolderName}`,
      `/${this.context.options.partialsFolderName}`,
      `/${this.context.options.hooksFolderName}`,
      `/${this.context.options.helpersFolderName}`,
      `/${this.context.options.extensionFolderName}`,
      "**/.git/**/*",
      "**/node_modules/**/*",
      "node_modules",
      ".git",
    ];
    this.ignoredFolders = [
      path.resolve(context.templatePath, context.options.partialsFolderName),
      path.resolve(context.templatePath, context.options.hooksFolderName),
      path.resolve(context.templatePath, context.options.helpersFolderName),
      path.resolve(context.templatePath, context.options.extensionFolderName),
      path.resolve(context.templatePath, ".git"),
      path.resolve(context.templatePath, "node_modules"),
    ];
    this.handlebarsProcessor = new HandlebarsProcessor();
    this.hooks = {};
  }

  async generate() {
    this.promisesHelper = new PromisesHelper();
    this.hooks = await fsUtil.loadScriptsAsObjects(
      this.context.hooksPath,
      true
    );
    this.extensions = await fsUtil.loadScriptsAsObjects(
      this.context.extensionPath,
      true
    );

    if (this.hooks.onGenerateStart) {
      await this.hooks.onGenerateStart(this.context);
    }

    // Loading handlebars js custom helper
    await HandlebarsProcessor.loadHelpersFolder(
      path.resolve(this.context.templatePath, this.context.helpersPath)
    );

    const tree = fsUtil.getDirTreeSync(this.context.originPath);

    if (tree.type === "file") {
      await this.promisesHelper.exec(
        this.context,
        this._generate(this.context, tree)
      );
    }

    if (tree.type === "directory") {
      const _ctx = {
        ...this.context,
        ...{
          options: await this.loadOptions(tree, this.context),
        },
      };
      for (const child of tree.children) {
        await this.promisesHelper.exec(_ctx, this._generate(_ctx, child));
      }
    }

    await this.promisesHelper.await();
  }

  /**
   *
   * @param {any} ctx Context
   * @param {any} tree Tree Details
   * @returns {Promise} Promise
   */
  async _generate(ctx, tree) {
    const promisesHelper = new PromisesHelper();
    if (ignores(ctx.originPath, tree.path, this.ignoredPatterns)) {
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
    targetName = await Processors.Processor.runProcessorsPipeline(
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

    if (tree.type === "directory") {
      for (const child of tree.children) {
        // Removing target name from context.
        // The intens inside this folder must not be affected by this config.
        _ctx.options.targetName = null;
        await promisesHelper.exec(ctx, this._generate(_ctx, child));
      }
    }

    if (tree.type === "file") {
      const originFilePath = path.join(ctx.originPath, tree.name);

      const targetFilePath = path.join(ctx.targetPath, targetName);
      let targetContent;
      if (await fsUtil.pathExists(targetFilePath)) {
        if (ctx.options.appendStrategy === "ignore") {
          return Promise.resolve();
        }
        targetContent = await fsUtil.readFileContent(targetFilePath);
      }

      if (!(await isBinaryFile(originFilePath))) {
        const originFileContent = await fsUtil.readFileContent(originFilePath);

        const processors = _ctx.options.processors.map((p) => {
          if (this.extensions[p]) {
            return new this.extensions[p]();
          }
          if (Processors.Processor[p]) {
            return new Processors.Processor[p]();
          }
          return new (require(p))();
        });
        const srcContent = await Processors.Processor.runProcessorsPipeline(
          processors,
          _ctx,
          originFileContent
        );

        const appenders = _ctx.options.appenders.map((a) => {
          if (this.extensions[a]) {
            return new this.extensions[a]();
          }
          if (Appenders.Appender[a]) {
            return new Appenders.Appender[a]();
          }
          return new (require(a))();
        });
        let result = targetContent
          ? await Appenders.Appender.runAppendersPipeline(
              appenders,
              _ctx,
              srcContent,
              targetContent
            )
          : srcContent;

        result = _ctx.options.stripConfig(result);

        try {
          result = prettier.format(result, {
            filepath: targetFilePath,
            plugins: ["@prettier/plugin-xml"],
          });
        } catch (error) {
          // Just to quiet prettier errors
        }

        await promisesHelper.exec(
          _ctx,
          fsUtil.saveFile(targetFilePath, result, false)
        );
      } else {
        await fsUtil.ensureDir(path.dirname(targetFilePath));
        await promisesHelper.exec(
          _ctx,
          fsUtil.copyFile(originFilePath, targetFilePath)
        );
      }
    }

    return promisesHelper.await();
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
