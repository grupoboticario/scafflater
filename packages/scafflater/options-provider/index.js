const path = require("path");
const fsUtil = require("../fs-util");
const { RegionProvider } = require("../generator/region-provider");
const ignore = require("ignore");

/**
 * @typedef {object} ScafflaterOptions
 * @description The options to generate files
 * @property {(boolean|string[])} ignore - If boolean, indicates if a file or folder must be ignored. If array od strings, indicates patterns to ignore following the same rules to gitignore.
 */
class ScafflaterOptions {
  lineCommentTemplate = "# {{{comment}}}";
  lineCommentTemplate = "# {{{comment}}}";
  startRegionMarker = "@scf-region";
  endRegionMarker = "@end-scf-region";
  optionMarker = "@scf-option";
  // Can be handlebars
  targetName = null;
  // regex
  ignore = [".git", "node_modules", "package-lock.json"];
  annotate = false;
  annotationTemplate = `{{#lineComment this}}{{{options.startRegionMarker}}}{{/lineComment}}
{{#lineComment this}}This code was generated by scafflater{{/lineComment}}
{{#lineComment this}}@template {{{template.name}}} (v{{{template.version}}}){{/lineComment}}
{{#lineComment this}}@partial {{{partial.name}}}{{/lineComment}}
{{#each parameters }}
{{#lineComment this}}@{{{@key}}} {{{this}}}{{/lineComment}}
{{/each}}

{{{content}}}

{{#lineComment this}}{{{options.endRegionMarker}}}{{/lineComment}}`;
  appendStrategy = "append";

  processors = ["./processors/handlebars-processor"];
  appenders = ["./appenders/region-appender", "./appenders/appender"];

  scfFileName = ".scafflater";
  partialsFolderName = "_partials";
  hooksFolderName = "_hooks";
  helpersFolderName = "_helpers";

  cacheStorage = "tempDir";
  cacheStorages = {
    tempDir: "./storages/temp-dir-cache",
    homeDir: "./storages/home-dir-cache",
  };

  source = "github";
  sources = {
    github: "./git-template-source",
    localFolder: "./local-folder-template-source",
  };

  github_baseUrlApi = "https://api.github.com";
  github_baseUrl = "https://github.com";
  github_username = null;
  github_password = null;

  /**
   * @param {Options} parameterNameHere - Brief description of the parameter here. Note: For other notations of data types, please refer to JSDocs: DataTypes command.
   * @return {ReturnValueDataTypeHere} Brief description of the returning value here.
   */
  constructor(options = {}) {
    for (const option in options) {
      if (options.hasOwnProperty(option)) {
        this[option] = options[option];
      }
    }
  }

  /**
   * Loads Folder Options
   * @description Looks for .scafflater file in folder, loads it if exists and returns an ScaffolderOptions object with the actual parameters with the loaded from file.
   * @param {string} folderPath Folder to load the Options
   * @return {Promise<ScafflaterOptions>} The merged Options
   */
  getFolderOptions(folderPath) {
    return new Promise(async (resolve, reject) => {
      try {
        let result = { ...this };
        const scfFilePath = path.join(folderPath, this.scfFileName);
        if (await fsUtil.pathExists(scfFilePath)) {
          const info = await fsUtil.readJSON(scfFilePath);
          if (info.options) {
            result = { ...result, ...info.options };
          }
        }
        resolve(new ScafflaterOptions(result));
      } catch (error) {
        reject(error);
      }
    });
  }

  ignores(basePath, folderOrFile) {
    if (Array.isArray(this.ignore)) {
      const pathsToIgnore = ignore().add(this.ignore);
      const relativePath = folderOrFile
        .replace(basePath, "")
        .replace(/^\//, "");
      return relativePath !== "" && pathsToIgnore.ignores(relativePath);
    } else {
      return Boolean(this.ignore);
    }
  }

  /**
   * Loads File Options
   * @description Looks for @scf-option in file content, loads it if exists and returns an ScaffolderOptions object with the actual parameters with the loaded options from file.
   * @param {string} filePath File to load the Options
   * @return {Promise<ScafflaterOptions>} The merged Options
   */
  getFileOptions(filePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const fileContent = await fsUtil.readFileContent(filePath);
        const result = await this.getConfigFromString(fileContent);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Loads @scf-option from strong
   * @description Looks for @scf-option in string, loads it if exists and returns an ScaffolderOptions object with the actual parameters with the loaded options.
   * @param {string} str String with @scf-option
   * @return {Promise<ScafflaterOptions>} The merged Options
   */
  getConfigFromString(str) {
    return new Promise(async (resolve, reject) => {
      try {
        const configRegex = new RegExp(
          `.*${this.optionMarker}\\s*(?<json>{.*}).*`,
          "gi"
        );
        const configs = str.matchAll(configRegex);

        let newConfig = this;

        const regionProvider = new RegionProvider(this);
        let regions = regionProvider.getRegions(str);

        for (const c of configs) {
          try {
            // Ignore configuration in regions
            if (
              regions.findIndex(
                (r) => r.contentStart <= c.index && r.contentEnd >= c.index
              ) >= 0
            ) {
              continue;
            }

            newConfig = { ...newConfig, ...JSON.parse(c.groups.json) };
          } catch (error) {
            reject(new Error(`Could not parse option '${c.groups.name}'`));
          }
        }

        resolve(new ScafflaterOptions(newConfig));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Strips all @scf-option from strong
   * @description Looks for @scf-option in string, and removes the line with the config
   * @param {string} str String with @scf-option
   * @return {Promise<string>} The striped string
   */
  stripConfig(str) {
    return new Promise(async (resolve, reject) => {
      try {
        const configRegex = new RegExp(
          `.*${this.optionMarker}\\s*(?<json>{.*}).*`,
          "gi"
        );
        resolve(str.replace(configRegex, ""));
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = ScafflaterOptions;
