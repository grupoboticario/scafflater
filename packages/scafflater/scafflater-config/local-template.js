const { ScafflaterOptions } = require("../options");
const Config = require("./config");
const path = require("path");

/**
 * @class LocalTemplate
 */
class LocalTemplate {
  /**
   * Creates a template stored locally
   *
   * @param {string} folderPath - Template path
   * @param {string} configPath - Template config file path
   * @param {string} name - Template name
   * @param {string} description - Template description
   * @param {string} version - Template version
   * @param {LocalPartial[]} partials - The partials of the template
   * @param {(ScafflaterOptions|object)} options - Template options
   * @param {object[]} parameters - Template parameters
   */
  constructor( // NOSONAR
    folderPath,
    configPath,
    name,
    description,
    version,
    partials = [],
    options = {},
    parameters = []
  ) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.partials = partials;
    this.parameters = parameters;
    this.folderPath = folderPath;
    this.configPath = configPath;
    this.options = new ScafflaterOptions(options);
  }

  /**
   * Template config file path
   *
   * @type {string}
   */
  configPath;

  /**
   * Template path
   *
   * @description The template path
   * @type {string}
   */
  folderPath;

  /**
   * Template name
   *
   * @description The template name must follow the pattern [a-z-]{3,}
   * @type {string}
   */
  name;

  /**
   * Template description
   *
   * @type {string}
   */
  description;

  /**
   * Template version
   *
   * @description Should follow the semver patterns (https://semver.org/)
   * @type {string}
   */
  version;

  /**
   * Partials of the template
   *
   * @type {LocalPartial[]}
   */
  partials;

  /**
   * Scafflater Options to generate template
   *
   * @type {ScafflaterOptions}
   */
  options;

  /**
   * Parameters to generate template.
   *
   * @description Scafflater uses Inquirer to get the parameters through scafflater-cli. The objects in this list must be assigned to inquirer question object(https://github.com/SBoudrias/Inquirer.js#questions).
   * @type {object[]}
   */
  parameters;

  /**
   * Loads local template from a localPath
   *
   * @param {string} localPath Folder or .scafflater file path of partial
   * @returns {Promise<LocalTemplate[]>} A list of loaded templates from local path
   */
  static async loadFromPath(localPath) {
    const configs = await Config.scanLocalPath(localPath);
    if (!configs || configs.length <= 0) {
      return null;
    }

    const templateConfigs = configs.filter(
      (c) => c.config.template && c.config.template.name
    );
    if (templateConfigs.length <= 0) {
      return null;
    }

    const result = [];
    for (const templateConfig of templateConfigs) {
      result.push(
        new LocalTemplate(
          path.resolve(templateConfig.folderPath, ".."),
          templateConfig.filePath,
          templateConfig.config.template.name,
          templateConfig.config.template.description,
          templateConfig.config.template.version,
          [],
          templateConfig.config.template.options,
          templateConfig.config.template.parameters
        )
      );
    }

    const partialConfigs = configs.filter(
      (c) => c.config.partial && c.config.partial.name
    );
    for (const partialConfig of partialConfigs) {
      const template = result.find((t) =>
        partialConfig.folderPath.startsWith(path.dirname(t.configPath))
      );
      if (!template) {
        throw new Error(
          `${partialConfig.filePath}: partial does not belong to any template.`
        );
      }

      template.partials.push(
        new LocalPartial(
          partialConfig.folderPath,
          partialConfig.config.partial.name,
          partialConfig.config.partial.description,
          partialConfig.config.partial.options,
          partialConfig.config.partial.parameters
        )
      );
    }

    return Promise.resolve(result);
  }
}

/**
 * @class LocalPartial
 */
class LocalPartial {
  /**
   * Creates a Partial stored locally
   *
   * @param {string} folderPath - Partial path
   * @param {string} name - Partial name
   * @param {string} description - Partial description
   * @param {(ScafflaterOptions|object)} options - Partial options
   * @param {object[]} parameters - Partial parameters
   */
  constructor(folderPath, name, description, options = {}, parameters = []) {
    this.name = name;
    this.description = description;
    this.options = new ScafflaterOptions(options);
    this.parameters = parameters;
    this.folderPath = folderPath;
  }

  /**
   * Partial path
   *
   * @description The partial path
   * @type {string}
   */
  folderPath;

  /**
   * Partial name
   *
   * @description The Partial name must follow the pattern [a-z-]{3,}
   * @type {string}
   */
  name;

  /**
   * Partial description
   *
   * @type {string}
   */
  description;

  /**
   * Scafflater Options to generate partial
   *
   * @type {ScafflaterOptions}
   */
  options;

  /**
   * Loads local partial from a localPath
   *
   * @param {string} localPath Folder or .scafflater file path of partial
   * @returns {Promise<LocalPartial>} The partial in the localPath, if it exists.
   */
  static async loadFromPath(localPath) {
    const configLoadResult = await Config.fromLocalPath(localPath);
    if (!configLoadResult.fileContent.partial) {
      throw new Error(
        `'${configLoadResult.filePath}': the scafflater file does not describe a partial.`
      );
    }

    return Promise.resolve(
      new LocalPartial(
        configLoadResult.folderPath,
        configLoadResult.fileContent.partial.name,
        configLoadResult.fileContent.partial.description,
        configLoadResult.fileContent.partial.options ?? {},
        configLoadResult.fileContent.partial.parameters ?? []
      )
    );
  }
}

module.exports = { LocalTemplate, LocalPartial };
