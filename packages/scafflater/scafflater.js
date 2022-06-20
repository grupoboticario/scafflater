const { TemplateManager } = require("./template-manager");
const Generator = require("./generator");
const path = require("path");
const { ScafflaterOptions } = require("./options");
const { maskParameters } = require("./util");
const { Config } = require("./scafflater-config/config");
const RanTemplate = require("./scafflater-config/ran-template");
const RanPartial = require("./scafflater-config/ran-partial");
const { TemplateInitialized } = require("./errors");
const fs = require("fs-extra");

/**
 * Scafflater class
 */
class Scafflater {
  /**
   * Scafflater constructor.
   *
   * @param {?(ScafflaterOptions|object)} options - Scafflater configuration. If null, will get the default configuration.
   * @param {?TemplateManager} templateManager The template manager
   */
  constructor(options = {}, templateManager = null) {
    this.options = new ScafflaterOptions(options);
    this.templateManager =
      templateManager ?? TemplateManager.fromOptions(options);
  }

  /**
   * Run scafflater
   *
   * @param {string} originPath The path where the template or partial is stored
   * @param {object} parameters Parameters for the generation process
   * @param {string} templatePath The template path
   * @param {string} targetPath The path where code must be generated
   * @param {object} ctx The context of generation
   * @returns {Promise<void>}
   */
  async run(originPath, parameters, templatePath, targetPath = "./", ctx = {}) {
    const options = new ScafflaterOptions({ ...this.options, ...ctx.options });

    const helpersPath = path.resolve(
      templatePath,
      options.scfFolderName,
      options.helpersFolderName
    );
    options.logger.debug(`Helpers Path: ${helpersPath}`);
    const hooksPath = path.resolve(
      templatePath,
      options.scfFolderName,
      options.hooksFolderName
    );
    options.logger.debug(`Hooks Path: ${hooksPath}`);
    const extensionPath = path.resolve(
      templatePath,
      options.scfFolderName,
      options.extensionFolderName
    );
    options.logger.debug(`Extensions Path: ${extensionPath}`);

    const _ctx = {
      ...ctx,
      ...{
        originPath,
        parameters,
        targetPath,
        helpersPath,
        hooksPath,
        extensionPath,
        options,
        templatePath,
      },
    };

    await new Generator(_ctx).generate();

    return Promise.resolve();
  }

  /**
   * Initializes the basic structure for scafflater template.
   *
   * @param {string} sourceKey - Source Template key
   * @param {object} parameters - Parameters used to generate the template
   * @param {string} templateVersion - Template version
   * @param {string} targetPath - Path where the results must be placed
   * @returns {Promise<void>}
   */
  async init(
    sourceKey,
    parameters,
    templateVersion = "last",
    targetPath = "./"
  ) {
    const localTemplate = await this.templateManager.getTemplateFromSource(
      sourceKey,
      templateVersion
    );
    this.options.logger.debug(
      `Local Template Source: ${localTemplate.folderPath}`
    );

    const targetConfigPath = path.resolve(
      targetPath,
      ".scafflater",
      "scafflater.jsonc"
    );

    let targetConfig = (await Config.fromLocalPath(targetConfigPath, true))
      ?.config;
    this.options.logger.debug(
      `== TARGET CONFIG == \n ${JSON.stringify(
        targetConfig,
        null,
        2
      )} =================== \n`
    );

    if (targetConfig.isInitialized(localTemplate.name)) {
      throw new TemplateInitialized(localTemplate.name);
    }

    parameters = targetConfig.getPersistedParameters(parameters);
    this.options.logger.debug(
      `== PERSISTED PARAMETERS == \n ${JSON.stringify(
        targetConfig,
        null,
        2
      )} ========================== \n`
    );

    const maskedParameters = maskParameters(
      parameters,
      localTemplate.parameters
    );

    const ctx = {
      template: localTemplate,
      target: targetConfig,
      options: { ...this.options, ...localTemplate.options },
    };

    await this.run(
      localTemplate.folderPath,
      parameters,
      localTemplate.folderPath,
      targetPath,
      ctx
    );

    const initPath = path.resolve(
      localTemplate.folderPath,
      localTemplate.options.scfFolderName,
      localTemplate.options.initFolderName
    );
    if (await fs.pathExists(initPath)) {
      this.options.logger.debug(`Run init on '${initPath}'`);
      await this.run(
        initPath,
        parameters,
        localTemplate.folderPath,
        targetPath,
        ctx
      );
    }

    // Reloading config, just in case it was update in generation
    targetConfig = (await Config.fromLocalPath(targetConfigPath, true))?.config;

    targetConfig.templates.push(
      new RanTemplate(
        localTemplate.name,
        templateVersion === "last" ? localTemplate.version : templateVersion,
        this.templateManager.templateSource.getSource(sourceKey),
        maskedParameters
      )
    );

    targetConfig.setPersistedParameters(localTemplate, parameters);
    await targetConfig.save(targetConfigPath);
  }

  /**
   * Brief description of the function here.
   *
   * @summary If the description is long, write your summary here. Otherwise, feel free to remove this.
   * @param {string} templateName The template name thar includes the partial
   * @param {string} partialName The partial name
   * @param {object} parameters Parameters used to generate partials
   * @param {string} targetPath Path where the results must be placed
   * @returns {Promise<string>} Brief description of the returning value here.
   */
  async runPartial(templateName, partialName, parameters, targetPath = "./") {
    const targetConfigPath = path.resolve(
      targetPath,
      ".scafflater",
      "scafflater.jsonc"
    );
    const targetConfig = (await Config.fromLocalPath(targetConfigPath))?.config;
    this.options.logger.debug(
      `== TARGET CONFIG == \n ${JSON.stringify(
        targetConfig,
        null,
        2
      )} =================== \n`
    );

    const ranTemplate = targetConfig.templates.find(
      (t) => t.name === templateName
    );
    if (!ranTemplate) {
      throw new Error(
        `${templateName}: no initialized template found. You must init it before using.`
      );
    }

    let localTemplate = await this.templateManager.getTemplate(
      ranTemplate.name,
      ranTemplate.version,
      ranTemplate.source
    );
    if (!localTemplate) {
      throw new Error(
        `${templateName}: cannot load template from source ('${ranTemplate.source.name}': '${ranTemplate.source.key}').`
      );
    }
    this.options.logger.debug(
      `Local Template Source: ${localTemplate.folderPath}`
    );

    let localPartial = localTemplate.partials.find(
      (p) => p.name === partialName
    );
    if (!localPartial) {
      localTemplate = await this.templateManager.getTemplateFromSource(
        ranTemplate.source.key
      );
      localPartial = localTemplate.partials.find((p) => p.name === partialName);
    }

    if (!localPartial) {
      throw new Error(
        `${partialName}: cannot load partial from template '${templateName}' ('${ranTemplate.source.name}': '${ranTemplate.source.key}').`
      );
    }

    parameters = targetConfig.getPersistedParameters(parameters);
    this.options.logger.debug(
      `== PERSISTED PARAMETERS == \n ${JSON.stringify(
        targetConfig,
        null,
        2
      )} ========================== \n`
    );

    const ctx = {
      partial: localPartial,
      template: localTemplate,
      templatePath: localTemplate.folderPath,
      target: targetConfig,
      options: { ...this.options, ...localPartial.options },
    };

    await this.run(
      localPartial.folderPath,
      parameters,
      localTemplate.folderPath,
      targetPath,
      ctx
    );

    if (localPartial.options.logRun) {
      ranTemplate.partials.push(
        new RanPartial(
          partialName,
          maskParameters(parameters, localTemplate.parameters)
        )
      );
    }

    targetConfig.setPersistedParameters(
      localTemplate,
      parameters,
      localPartial
    );
    await targetConfig.save(targetConfigPath);
  }
}

module.exports = { Scafflater };
