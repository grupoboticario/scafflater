const { PartialConfig } = require("./partial-config");
const RanTemplate = require("./ran-template");
const { TemplateConfig } = require("./template-config");
const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const stripJsonComments = require("strip-json-comments");
const { Source } = require("./source");
const { ScafflaterOptions } = require("../options");
const ScafflaterFileNotFoundError = require("../errors/scafflater-file-not-found-error");

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
   */
  constructor(template = null, partial = null, templates = [], options = {}) {
    this.template = template;
    this.partial = partial;
    this.templates = templates;
    this.options = options;
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
