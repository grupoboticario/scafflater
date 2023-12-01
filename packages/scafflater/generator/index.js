import path from "path";
import fsUtil from "../fs-util/index.js";
import * as Processors from "./processors/index.js";
import * as Appenders from "./appenders/index.js";
import HandlebarsProcessor from "./processors/handlebars-processor.js";
import prettier from "prettier";
import ScafflaterOptions from "../options/index.js";
import { isBinaryFile } from "isbinaryfile";
import { ignores } from "../util/index.js";
import { glob } from "glob";

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

export default class Generator {
  /**
   * Brief description of the function here.
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
      true,
    );
    this.context.options.logger.debug(
      `Hooks Loaded: ${
        Object.keys(this.hooks).length > 0
          ? "No hook defined"
          : Object.keys(this.hooks).join(", ")
      }`,
    );

    this.extensions = await fsUtil.loadScriptsAsObjects(
      this.context.extensionPath,
      true,
    );
    this.context.options.logger.debug(
      `Extensions Loaded: ${
        Object.keys(this.extensions).length > 0
          ? "No extension defined"
          : Object.keys(this.extensions).join(", ")
      }`,
    );

    if (this.hooks.onGenerateStart) {
      this.context.options.logger.debug(`Executing 'onGenerateStart' hook`);
      await this.hooks.onGenerateStart(this.context);
    }

    // Loading handlebars js custom helper
    await HandlebarsProcessor.loadHelpersFolder(
      path.resolve(this.context.templatePath, this.context.helpersPath),
    );

    this.context.prettierConfig = await this.loadPrettierOptions(
      this.context.originPath,
    );
    this.context.options.logger.debug(
      `=== PRETTIER CONFIG === \n  Loaded from: ${
        this.context.originPath
      }\n  ${JSON.stringify(this.context.prettierConfig, null, 2)}`,
    );

    const tree = fsUtil.getDirTreeSync(this.context.originPath);

    if (tree.type === "file") {
      await this.promisesHelper.exec(
        this.context,
        this._generate(this.context, tree),
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
        `Ignoring: ${tree.path.replace(ctx.templatePath, "")}`,
      );
      return Promise.resolve();
    }

    const options = await this.loadOptions(tree, ctx);
    if (options.ignores(ctx.originPath, tree.path)) {
      this.context.options.logger.info(
        `Ignoring: ${tree.path.replace(ctx.templatePath, "")}`,
      );
      return Promise.resolve();
    }

    this.context.options.logger.info(
      `Processing: ${tree.path.replace(ctx.templatePath, "")}`,
    );

    let targetNameOption = tree.name;
    if (options.targetName != null) {
      targetNameOption = options.targetName;
    }
    const targetNames = await this.resolveTargetNames(targetNameOption, ctx);

    if (targetNames.every((name) => name === "")) {
      this.context.options.logger.info(`\tIgnoring: Empty target name`);
      return Promise.resolve();
    }
    if (targetNames.length > 1) {
      this.context.options.logger.info(
        `\tMultiple targets detected. The result will be appended on multiple destinations:`,
      );
      targetNames.forEach((name) =>
        this.context.options.logger.info(`\t\t${name}`),
      );
    }

    for (const targetName of targetNames) {
      if (targetName === "") {
        // empty names must be ignored
        continue;
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
          } else {
            if (ctx.options.appendStrategy === "appendIfExists") {
              _ctx.options.logger.info(
                `\tIgnoring: appendStrategy = 'appendIfExists' and destination does not exists`,
              );
              return Promise.resolve();
            }
          }

          if (!(await isBinaryFile(originFilePath))) {
            const originFileContent =
              await fsUtil.readFileContent(originFilePath);

            const processors = [];
            for (const processor of _ctx.options.processors) {
              if (this.extensions[processor]) {
                processors.push(new this.extensions[processor]());
              } else if (Processors.Processor[processor]) {
                processors.push(new Processors.Processor[processor]());
              } else {
                try {
                  const Processor = (await import(processor)).default;
                  processors.push(new Processor());
                } catch {
                  // Trying to concat '.js' to compatibility with versions before pure esm migration
                  const Processor = (await import(processor + ".js")).default;
                  processors.push(new Processor());
                }
              }
            }

            const srcContent = await Processors.Processor.runProcessorsPipeline(
              processors,
              _ctx,
              originFileContent,
            );

            const appenders = [];
            for (const appender of _ctx.options.appenders) {
              if (this.extensions[appender]) {
                appenders.push(new this.extensions[appender]());
              } else if (Appenders.Appender[appender]) {
                appenders.push(new Appenders.Appender[appender]());
              } else {
                try {
                  const Appender = (await import(appender)).default;
                  appenders.push(new Appender());
                } catch (error) {
                  // Trying to concat '.js' to compatibility with versions before pure esm migration
                  const Appender = (await import(appender + ".js")).default;
                  appenders.push(new Appender());
                }
              }
            }

            let result = targetContent
              ? await Appenders.Appender.runAppendersPipeline(
                  appenders,
                  _ctx,
                  srcContent,
                  targetContent,
                )
              : srcContent;

            result = _ctx.options.stripConfig(result);

            try {
              const options = {
                ...this.context.prettierConfig,
                filepath: targetFilePath,
              };
              if (targetFilePath.endsWith(".xml")) {
                options.plugins = ["@prettier/plugin-xml"];
              }
              result = await prettier.format(result, options);
            } catch (error) {
              _ctx.options.logger.debug(`\tPrettier error: \n${error.message}`);
            }

            await promisesHelper.exec(
              _ctx,
              fsUtil.saveFile(targetFilePath, result, false),
            );
          } else {
            _ctx.options.logger.info(
              `\tBinary file. Just copy to destination.`,
            );
            await fsUtil.ensureDir(path.dirname(targetFilePath));
            await promisesHelper.exec(
              _ctx,
              fsUtil.copyFile(originFilePath, targetFilePath),
            );
          }
        }
      } catch (error) {
        _ctx.options.logger.error(`\tError: ${error.message}`);
        throw new Error(
          `${tree.path.replace(ctx.templatePath, "")}\t${error.message}`,
        );
      }
    }

    return promisesHelper.await();
  }

  /**
   * Loads and merge the options of file or folder with the context options
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

  async resolveTargetNames(targetName, context) {
    const targetGlobPattern = /glob<(?<pattern>.*)>/gi;
    const e = targetGlobPattern.exec(targetName);
    if (e?.groups.pattern) {
      const pattern = await Processors.Processor.runProcessorsPipeline(
        [this.handlebarsProcessor],
        context,
        e?.groups.pattern,
      );

      return glob(pattern, { cwd: context.targetPath });
    }

    const eachPattern = /each<(?<array>.*)>/gi;
    const eachRegexResult = eachPattern.exec(targetName);
    if (eachRegexResult?.groups.array) {
      const strArray = await Processors.Processor.runProcessorsPipeline(
        [this.handlebarsProcessor],
        context,
        eachRegexResult?.groups.array,
      );

      return strArray.split(",").filter((s) => s.trim() !== "");
    }

    return [
      await Processors.Processor.runProcessorsPipeline(
        [this.handlebarsProcessor],
        context,
        targetName,
      ),
    ];
  }
}
