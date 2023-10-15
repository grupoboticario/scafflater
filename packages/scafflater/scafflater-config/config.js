import PartialConfig from "./partial-config.js";
import PersistedParameter from "./persisted-parameter.js";
import RanTemplate from "./ran-template.js";
import TemplateConfig from "./template-config.js";
import fs from "../fs-util/index.js";
import path from "path";
import { glob } from "glob";
import stripJsonComments from "strip-json-comments";
import Source from "./source.js";
import ScafflaterOptions from "../options/index.js";
import ScafflaterFileNotFoundError from "../errors/scafflater-file-not-found-error.js";
import TemplateNotInitializedError from "../errors/template-not-initialized-error.js";

/**
 * @typedef ConfigLoadResult
 * @property {string} folderPath The folder path from where the config was loaded.
 * @property {string} filePath The file path from where the config was loaded.
 * @property {Config} config The loaded file content.
 */

/**
 * List .scafflater files in directory tree
 * @param {string} folderPath - Path to look for files
 * @returns {Promise<string[]>} List of file names
 */
const listScafflaterFiles = async (folderPath) => {
  return glob(`/**/scafflater.jsonc`, { root: folderPath, dot: true });
};

/**
 * Checks if an object is empty
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
export default class Config {
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
    globalParameters = [],
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
   * @type {TemplateConfig}
   */
  template;

  /**
   * Template Config.
   * If the folder contains a Template, this property describes it.
   * @type {PartialConfig}
   */
  partial;

  /**
   * The templates used to generated code in ths folder
   * @type {RanTemplate[]}
   */
  templates;

  /**
   * Options for the folder where the scafflater file is present
   * @type {ScafflaterOptions}
   */
  options;

  /**
   * The stored global parameters values
   * @type {PersistedParameter[]}
   */
  globalParameters;

  /**
   * Saves the the config to a scafflater.jsonc file
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
        2,
      ),
    );
  }

  /**
   * Checks if the template is initialized
   * @param {string} templateName Template name to check
   * @returns {boolean} True if is initialized
   */
  isInitialized(templateName) {
    return this.templates.findIndex((t) => t.name === templateName) >= 0;
  }

  /**
   * Merges the persisted parameters, either globals or templates parameters, with an object of existing parameters
   * @param {?object} parameters Parameters to merge to
   * @param {?string} templateName The template name to get persisted parameters from. Null if it must not be loaded.
   * @returns {object} Object with the merged globals, templates and received parameters
   */
  getPersistedParameters(parameters = {}, templateName = undefined) {
    let persistedParameters = PersistedParameter.reduceParameters(
      this.globalParameters,
    );

    if (templateName) {
      const ranTemplate = this.templates.find((rt) => rt.name === templateName);
      if (ranTemplate) {
        persistedParameters = {
          ...persistedParameters,
          ...PersistedParameter.reduceParameters(
            ranTemplate.templateParameters,
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
   * @param {import("./local-template").LocalTemplate} template The template with the parameters to be analyzed
   * @param {object} parameters The object with the values to be persisted
   * @param {import("./local-template").LocalPartial} partial The partial with the parameters to be analyzed
   */
  setPersistedParameters(template, parameters = {}, partial = null) {
    const globalParameters = template.getParameterConfigsByScope(
      "global",
      partial,
    );
    const templateParameters = template.getParameterConfigsByScope(
      "template",
      partial,
    );

    for (const p of globalParameters) {
      if (!parameters[p.name]) continue;
      // TODO: warn that masked parameters cannot be persisted
      if (p.mask) continue;
      PersistedParameter.updateParameters(
        this.globalParameters,
        new PersistedParameter(p.name, parameters[p.name]),
      );
    }

    const templateIndex = this.templates.findIndex(
      (t) => t.name === template.name,
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
        new PersistedParameter(p.name, parameters[p.name]),
      );
    }
  }

  /**
   * Load an single file from a path
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
        `'${localPath}': the path does not exist.`,
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
        json.template.parameters,
        json.template.persistedParameters,
        json.template.hooks,
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
            Object.assign(new PartialConfig(), rp),
          );
        }
        templates.push(rt);
      }
    }

    const globalParameters = json.globalParameters
      ? json.globalParameters.map((g) =>
          Object.assign(new PersistedParameter(), g),
        )
      : [];

    return Promise.resolve({
      folderPath: path.dirname(filePath),
      filePath,
      config: new Config(
        template,
        partial,
        templates,
        json.options ?? {},
        globalParameters,
      ),
    });
  }

  /**
   * Scans a directory tree indicated by localPath and returns all .scafflater configurations.
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
