const { PartialConfig } = require("./partial-config");
const { PersistedParameter } = require("./persisted-parameter");
const RanTemplate = require("./ran-template");
const { TemplateConfig } = require("./template-config");
const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const stripJsonComments = require("strip-json-comments");
const { Source } = require("./source");
const { ScafflaterOptions } = require("../options");
const ScafflaterFileNotFoundError = require("../errors/scafflater-file-not-found-error");
const { LocalPartial, LocalTemplate } = require("./local-template");
const TemplateNotInitializedError = require("../errors/template-not-initialized-error");

/**
 * @typedef ConfigLoadResult
 * @property {string} folderPath The folder path from where the config was loaded.
 * @property {string} filePath The file path from where the config was loaded.
 * @property {Config} config The loaded file content.
 */

/**
 * List .scafflater files in directory tree
 *
 * @param {string} folderPath - Path to look for files
 * @returns {Promise<string[]>} List of file names
 */
const listScafflaterFiles = async (folderPath) => {
  return new Promise((resolve, reject) => {
    try {
      glob(
        `/**/scafflater.jsonc`,
        { root: folderPath, dot: true },
        (err, files) => {
          if (err) reject(err);
          if (!files || files.length <= 0) resolve([]);
          resolve(files);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Checks if an object is empty
 *
 * @param {object} obj The object to be tested
 * @returns {boolean} True if the object is null
 */
function isEmptyObject(obj) {
  return obj === null || obj === undefined || !Object.keys(obj).length;
}

/**
 * @class Output
 * @description Output configuration, with info about generated templates and partials.
 */
class Config {
  /**
   *
   * @param {?TemplateConfig} template The template config
   * @param {?PartialConfig} partial The partial config
   * @param {?RanTemplate[]} templates The ran templates
   * @param {ScafflaterOptions|object} options The folder scafflater options
   * @param {?PersistedParameter[]} globalParameters The stored global parameters values
   */
  constructor(
    template = null,
    partial = null,
    templates = [],
    options = {},
    globalParameters = []
  ) {
    this.template = template;
    this.partial = partial;
    this.templates = templates;
    this.options = options;
    this.globalParameters = globalParameters;
  }

  /**
   * Template Config.
   * If the folder contains a Template, this property describes it.
   *
   * @type {TemplateConfig}
   */
  template;

  /**
   * Template Config.
   * If the folder contains a Template, this property describes it.
   *
   * @type {PartialConfig}
   */
  partial;

  /**
   * The templates used to generated code in ths folder
   *
   * @type {RanTemplate[]}
   */
  templates;

  /**
   * Options for the folder where the scafflater file is present
   *
   * @type {ScafflaterOptions}
   */
  options;

  /**
   * The stored global parameters values
   *
   * @type {PersistedParameter[]}
   */
  globalParameters;

  /**
   * Saves the the config to a scafflater.jsonc file
   *
   * @param {string} filePath The file path where file must be saved
   */
  async save(filePath) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(
      filePath,
      JSON.stringify(
        this,
        (key, value) => {
          if (value === null || value === undefined || isEmptyObject(value)) {
            return undefined;
          }
          return value;
        },
        2
      )
    );
  }

  /**
   * Checks if the template is initialized
   *
   * @param {string} templateName Template name to check
   * @returns {boolean} True if is initialized
   */
  isInitialized(templateName) {
    return this.templates.findIndex((t) => t.name === templateName) >= 0;
  }

  /**
   * Merges the persisted parameters, either globals or templates parameters, with an object of existing parameters
   *
   * @param {?object} parameters Parameters to merge to
   * @param {?string} templateName The template name to get persisted parameters from. Null if it must not be loaded.
   * @returns {object} Object with the merged globals, templates and received parameters
   */
  getPersistedParameters(parameters = {}, templateName = undefined) {
    let persistedParameters = PersistedParameter.reduceParameters(
      this.globalParameters
    );

    if (templateName) {
      const ranTemplate = this.templates.find((rt) => rt.name === templateName);
      if (ranTemplate) {
        persistedParameters = {
          ...persistedParameters,
          ...PersistedParameter.reduceParameters(
            ranTemplate.templateParameters
          ),
        };
      }
    }
    return {
      ...persistedParameters,
      ...parameters,
    };
  }

  /**
   * Check the scopes of template and partial parameters and stores in the appropriate parameter on config
   *
   * @param {LocalTemplate} template The template with the parameters to be analysed
   * @param {object} parameters The object with the values to be persisted
   * @param {LocalPartial} partial The partial with the parameters to be analysed
   */
  setPersistedParameters(template, parameters = {}, partial = null) {
    const globalParameters = template.getParameterConfigsByScope(
      "global",
      partial
    );
    const templateParameters = template.getParameterConfigsByScope(
      "template",
      partial
    );

    for (const p of globalParameters) {
      if (!parameters[p.name]) continue;
      // TODO: warn that masked parameters cannot be persisted
      if (p.mask) continue;
      PersistedParameter.updateParameters(
        this.globalParameters,
        new PersistedParameter(p.name, parameters[p.name])
      );
    }

    const templateIndex = this.templates.findIndex(
      (t) => t.name === template.name
    );
    if (templateIndex < 0) {
      throw new TemplateNotInitializedError(template.name);
    }

    for (const p of templateParameters) {
      if (!parameters[p.name]) continue;
      // TODO: warn that masked parameters cannot be persisted
      if (p.mask) continue;
      PersistedParameter.updateParameters(
        this.templates[templateIndex].templateParameters,
        new PersistedParameter(p.name, parameters[p.name])
      );
    }
  }

  /**
   * Load an single file from a path
   *
   * @param {string} localPath Folder or scafflater.jsonc file path of partial
   * @param {boolean} createIfNotExists If true, will create the file if if
   * @returns {Promise<ConfigLoadResult>} The loaded config result. Null if not found.
   */
  static async fromLocalPath(localPath, createIfNotExists = false) {
    if (!(await fs.pathExists(localPath))) {
      if (createIfNotExists) {
        return Promise.resolve({
          folderPath: path.dirname(localPath),
          localPath,
          config: new Config(null, null, []),
        });
      }

      throw new ScafflaterFileNotFoundError(
        `'${localPath}': the path does not exist.`
      );
    }

    let filePath = localPath;
    if ((await fs.lstat(localPath)).isDirectory()) {
      filePath = path.resolve(localPath, "scafflater.jsonc");
    }

    if (!(await fs.pathExists(filePath))) {
      return Promise.resolve(null);
    }

    const fileContent = (await fs.readFile(filePath)).toString();
    let json = {};
    try {
      json = JSON.parse(stripJsonComments(fileContent));
    } catch (e) {
      throw new Error(`'${filePath}': failed to load. Could not load as Json.`);
    }

    let template = null;
    if (json.template) {
      template = new TemplateConfig(
        json.template.name,
        json.template.version,
        json.template.description,
        json.template.options,
        json.template.parameters
      );
    }
    let partial = null;
    if (json.partial) {
      partial = Object.assign(new PartialConfig(), json.partial);
    }

    const templates = [];
    if (json.templates) {
      for (const ranTemplate of json.templates) {
        const rt = Object.assign(new RanTemplate(), ranTemplate);
        rt.source = Object.assign(new Source(), ranTemplate.source);
        if (ranTemplate.partials) {
          rt.partials = ranTemplate.partials.map((rp) =>
            Object.assign(new PartialConfig(), rp)
          );
        }
        templates.push(rt);
      }
    }

    return Promise.resolve({
      folderPath: path.dirname(filePath),
      filePath,
      config: new Config(template, partial, templates, json.options ?? {}),
    });
  }

  /**
   * Scans a directory tree indicated by localPath and returns all .scafflater configurations.
   *
   * @param {string} localPath Local path to scan
   * @returns {Promise<ConfigLoadResult[]>} The loaded config result
   */
  static async scanLocalPath(localPath) {
    if (!(await fs.pathExists(localPath))) {
      throw new Error(`'${localPath}': the path does not exist.`);
    }

    let folderPath = localPath;
    if (!(await fs.lstat(localPath)).isDirectory()) {
      folderPath = path.dirname(localPath);
    }

    const files = await listScafflaterFiles(folderPath);
    const configs = [];
    for (const file of files) {
      try {
        configs.push(await Config.fromLocalPath(file));
      } catch (error) {
        console.log(`Failed to read '${file}'`);
        console.log(error);
        console.log(`Ignoring file '${file}'`);
      }
    }

    return Promise.resolve(configs);
  }
}

module.exports = { Config };
