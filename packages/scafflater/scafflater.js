const TemplateManager = require("./template-manager");
const Generator = require("./generator");
const fsUtil = require("./fs-util");
const path = require("path");
const ScafflaterOptions = require("./options-provider");
const { maskParameters } = require("./util");

/**
 * Scafflater class
 */
class Scafflater {
  /**
   * Scafflater constructor.
   * @param {ScafflaterOptions} options - Scafflater configuration. If null, will get the default configuration.
   * @param {string} sourceKey - The source key
   */
  constructor(options = {}, templateManager = null) {
    this.options = new ScafflaterOptions(options);
    this.templateManager = templateManager ?? new TemplateManager(this.options);
  }

  /**
   * Run scafflater
   * @param {ParamDataTypeHere} parameterNameHere - Brief description of the parameter here. Note: For other notations of data types, please refer to JSDocs: DataTypes command.
   *
   * @return {Promise<string} Brief description of the returning value here.
   */
  async run(originPath, parameters, templatePath, targetPath = "./", ctx = {}) {
    const options = new ScafflaterOptions(ctx.options);

    const helpersPath = path.resolve(templatePath, options.helpersFolderName);
    const hooksPath = path.resolve(templatePath, options.hooksFolderName);

    const _ctx = {
      ...ctx,
      ...{
        originPath,
        parameters,
        targetPath,
        helpersPath,
        hooksPath,
        options,
      },
    };

    await new Generator(_ctx).generate();

    return Promise.resolve();
  }

  /**
   * Initializes the basic structure for this scafflater template.
   * @param {string} sourceKey - Source Template key
   * @param {object} parameters - Parameters used to generate partials
   * @param {string} targetPath - Path where the results must be placed
   * @return {Promise<object>} Brief description of the returning value here.
   */
  async init(sourceKey, parameters, targetPath = "./") {
    const { path: templatePath, config } =
      await this.templateManager.templateSource.getTemplate(sourceKey);

    const maskedParameters = maskParameters(parameters, config.parameters);

    let targetInfo = {
      templates: [
        {
          name: config.name,
          version: config.version,
          source: { ...config.source },
          parameters: maskedParameters,
        },
      ],
    };
    const scfFile = path.resolve(targetPath, this.options.scfFileName);

    if (await fsUtil.pathExists(scfFile)) {
      const existingTargetInfo = await fsUtil.readJSON(scfFile);
      if (!existingTargetInfo.templates) existingTargetInfo.templates = [];
      existingTargetInfo.templates.push(targetInfo.templates[0]);
      targetInfo = existingTargetInfo;
    }

    const ctx = {
      template: await this.templateManager.getTemplateInfo(
        config.name,
        config.version
      ),
      target: targetInfo,
      options: config.options,
    };

    await this.run(templatePath, parameters, templatePath, targetPath, ctx);

    await fsUtil.writeJSON(scfFile, targetInfo);
    return Promise.resolve(scfFile);
  }

  /**
   * Brief description of the function here.
   * @summary If the description is long, write your summary here. Otherwise, feel free to remove this.
   * @param {ParamDataTypeHere} parameterNameHere - Brief description of the parameter here. Note: For other notations of data types, please refer to JSDocs: DataTypes command.
   * @return {Promise<string>} Brief description of the returning value here.
   */
  async runPartial(partialPath, parameters, targetPath = "./") {
    const targetInfo = await fsUtil.readJSON(
      path.join(targetPath, this.options.scfFileName)
    );

    let partialInfo = await this.templateManager.getPartial(
      partialPath,
      targetInfo.template.name,
      targetInfo.template.version
    );

    if (!partialInfo) {
      // Trying to get the template
      // TODO: Get template by version
      await this.templateManager.getTemplateFromSource(
        targetInfo.template.source.key
      );
      partialInfo = await this.templateManager.getPartial(
        partialPath,
        targetInfo.template.name,
        targetInfo.template.version
      );
      if (!partialInfo) {
        return Promise.resolve(null);
      }
    }

    const templatePath = await this.templateManager.getTemplatePath(
      targetInfo.template.name,
      targetInfo.template.version
    );
    const templateInfo = await this.templateManager.getTemplateInfo(
      targetInfo.template.name,
      targetInfo.template.version
    );

    const ctx = {
      partial: partialInfo.config,
      template: templateInfo,
      templatePath,
      target: targetInfo,
      options: partialInfo.config.options,
    };

    await this.run(partialInfo.path, parameters, templatePath, targetPath, ctx);

    if (!targetInfo.partials) {
      targetInfo.partials = [];
    }

    const maskedParameters = maskParameters(
      parameters,
      partialInfo.config.parameters
    );

    if (
      partialInfo.config.options?.logRun == null ||
      partialInfo.config.options?.logRun === undefined ||
      partialInfo.config.options?.logRun
    ) {
      targetInfo.partials.push({
        path: `${targetInfo.template.name}/${partialPath}`,
        parameters: maskedParameters,
      });
    }

    return Promise.resolve(
      await fsUtil.writeJSON(
        path.join(targetPath, this.options.scfFileName),
        targetInfo
      )
    );
  }
}

module.exports = Scafflater;
