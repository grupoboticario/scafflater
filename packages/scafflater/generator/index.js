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
 * @typedef {object} Context
 * @description The context used by generator to generate files and folder structure
 * @property {string} originPath The folder path to origin template files
 * @property {object} parameters The parameters to generate the output
 * @property {string} targetPath The path where generated files and folders will be saved
 * @property {string} helpersPath The folder with handlebars helpers implementations
 * @property {ScafflaterOptions} options The scafflater options.
 */

/**
 * Helper to execute Promises
 */
class PromisesHelper {
  constructor() {
    this.promises = [];
  }

  /**
   * Executes a promise
   *
   * @param {Context} ctx Context
   * @param {Promise} promise Promise to execute
   */
  async exec(ctx, promise) {
    await promise;

    // if (ctx.options.mode === "debug") {
    //   await promise;
    // } else {
    //   this.promises.push(promise);
    // }
  }

  async await() {
    return Promise.all(this.promises);
  }
}

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
    this.context.options.logger.debug(
      `Hooks Loaded: ${
        Object.keys(this.hooks).length > 0
          ? "No hook defined"
          : Object.keys(this.hooks).join(", ")
      }`
    );

    this.extensions = await fsUtil.loadScriptsAsObjects(
      this.context.extensionPath,
      true
    );
    this.context.options.logger.debug(
      `Extensions Loaded: ${
        Object.keys(this.extensions).length > 0
          ? "No extension defined"
          : Object.keys(this.extensions).join(", ")
      }`
    );

    if (this.hooks.onGenerateStart) {
      this.context.options.logger.debug(`Executing 'onGenerateStart' hook`);
      await this.hooks.onGenerateStart(this.context);
    }

    // Loading handlebars js custom helper
    await HandlebarsProcessor.loadHelpersFolder(
      path.resolve(this.context.templatePath, this.context.helpersPath)
    );

    this.context.prettierConfig = await this.loadPrettierOptions(
      this.context.originPath
    );
    this.context.options.logger.debug(
      `=== PRETTIER CONFIG === \n  Loaded from: ${
        this.context.originPath
      }\n  ${JSON.stringify(this.context.prettierConfig, null, 2)}`
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
   * @param {Context} ctx Context
   * @param {any} tree Tree Details
   * @returns {Promise} Promise
   */
  async _generate(ctx, tree) {
    const promisesHelper = new PromisesHelper();
    if (ignores(ctx.originPath, tree.path, this.ignoredPatterns)) {
      this.context.options.logger.info(
        `Ignoring: ${tree.path.replace(ctx.templatePath, "")}`
      );
      return Promise.resolve();
    }

    const options = await this.loadOptions(tree, ctx);
    if (options.ignores(ctx.originPath, tree.path)) {
      this.context.options.logger.info(
        `Ignoring: ${tree.path.replace(ctx.templatePath, "")}`
      );
      return Promise.resolve();
    }

    this.context.options.logger.info(
      `Processing: ${tree.path.replace(ctx.templatePath, "")}`
    );

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
      this.context.options.logger.info(`\tIgnoring: Empty target name`);
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

    try {
      if (tree.type === "file") {
        const originFilePath = path.join(ctx.originPath, tree.name);

        const targetFilePath = path.join(ctx.targetPath, targetName);
        let targetContent;
        if (await fsUtil.pathExists(targetFilePath)) {
          if (ctx.options.appendStrategy === "ignore") {
            _ctx.options.logger.info(`\tIgnoring: appendStrategy = 'ignore'`);
            return Promise.resolve();
          }
          targetContent = await fsUtil.readFileContent(targetFilePath);
        }

        if (!(await isBinaryFile(originFilePath))) {
          const originFileContent = await fsUtil.readFileContent(
            originFilePath
          );

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
              ...this.context.prettierConfig,
              filepath: targetFilePath,
              // plugins: ["@prettier/plugin-xml"],
            });
          } catch (error) {
            _ctx.options.logger.debug(`\tPrettier error: \n${error.message}`);
          }

          await promisesHelper.exec(
            _ctx,
            fsUtil.saveFile(targetFilePath, result, false)
          );
        } else {
          _ctx.options.logger.info(`\tBinary file. Just copy to destination.`);
          await fsUtil.ensureDir(path.dirname(targetFilePath));
          await promisesHelper.exec(
            _ctx,
            fsUtil.copyFile(originFilePath, targetFilePath)
          );
        }
      }
    } catch (error) {
      _ctx.options.logger.error(`\tError: ${error.message}`);
      throw new Error(
        `${tree.path.replace(ctx.templatePath, "")}\t${error.message}`
      );
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
      return context.options.getFolderOptions(dirPath, context);
    }

    if (tree.type === "file") {
      const filePath = path.join(context.originPath, tree.name);
      return context.options.getFileOptions(filePath, context);
    }
  }

  async loadPrettierOptions(path) {
    let config = await prettier.resolveConfig(path);

    if (!config) config = {};

    if (!config.plugins) config.plugins = [];

    // config.plugins.push("@prettier/plugin-xml");

    return config;
  }
}

module.exports = Generator;
