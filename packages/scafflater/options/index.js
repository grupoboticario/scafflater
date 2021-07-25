const path = require("path");
const fsUtil = require("../fs-util");
const { RegionProvider } = require("../generator/region-provider");
const ignore = require("ignore");

/**
 * @class ScafflaterOptions
 * @classdesc The options to generate files
 */
class ScafflaterOptions {
  /**
   * @param {?(ScafflaterOptions|object)} options The options that must override defaults
   */
  constructor(options = {}) {
    for (const option in options) {
      this[option] = options[option];
    }
  }

  lineCommentTemplate = "# {{{comment}}}";
  startRegionMarker = "@scf-region";
  endRegionMarker = "@end-scf-region";
  optionMarker = "@scf-option";
  // Can be handlebars
  targetName = null;

  /**
   * Ignore files or folders
   *
   * @description If boolean, indicates if a file or folder must be ignored. If array of strings, indicates patterns (same patterns of gitignore) to ignore.
   * @type {(boolean|string[])} ignore
   */
  ignore;
  logRun = true;
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
  partialsFolderName = "partials";
  hooksFolderName = "hooks";
  helpersFolderName = "helpers";

  cacheStorage = "tempDir";
  cacheStorages = {
    tempDir: "./temp-dir-cache",
    homeDir: "./home-dir-cache",
  };

  source = "github";
  sources = {
    github: "./git-template-source",
    localFolder: "./local-folder-template-source",
  };

  githubBaseUrlApi = "https://api.github.com";
  githubBaseUrl = "https://github.com";
  githubUsername = null;
  githubPassword = null;

  /**
   * Loads Folder Options
   *
   * @description Looks for .scafflater file in folder, loads it if exists and returns an ScaffolderOptions object with the actual parameters with the loaded from file.
   * @param {string} folderPath Folder to load the Options
   * @returns {Promise<ScafflaterOptions>} The merged Options
   */
  async getFolderOptions(folderPath) {
    let result = { ...this };
    const scfFilePath = path.join(folderPath, this.scfFileName);
    if (await fsUtil.pathExists(scfFilePath)) {
      const info = await fsUtil.readJSON(scfFilePath);
      if (info.options) {
        result = { ...result, ...info.options };
      }
    }
    return Promise.resolve(new ScafflaterOptions(result));
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
   *
   * @description Looks for @scf-option in file content, loads it if exists and returns an ScaffolderOptions object with the actual parameters with the loaded options from file.
   * @param {string} filePath File to load the Options
   * @returns {Promise<ScafflaterOptions>} The merged Options
   */
  async getFileOptions(filePath) {
    const fileContent = await fsUtil.readFileContent(filePath);
    const result = this.getConfigFromString(fileContent);
    return Promise.resolve(result);
  }

  /**
   * Loads @scf-option from strong
   *
   * @description Looks for @scf-option in string, loads it if exists and returns an ScaffolderOptions object with the actual parameters with the loaded options.
   * @param {string} str String with @scf-option
   * @returns {Promise<ScafflaterOptions>} The merged Options
   */
  getConfigFromString(str) {
    const configRegex = new RegExp(
      `.*${this.optionMarker}\\s*(?<json>{.*}).*`,
      "gi"
    );
    const configs = str.matchAll(configRegex);

    let newConfig = this;

    const regionProvider = new RegionProvider(this);
    const regions = regionProvider.getRegions(str);

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
        throw new Error(`Could not parse option '${c.groups.name}'`);
      }
    }

    return new ScafflaterOptions(newConfig);
  }

  /**
   * Strips all @scf-option from strong
   *
   * @description Looks for @scf-option in string, and removes the line with the config
   * @param {string} str String with @scf-option
   * @returns {Promise<string>} The striped string
   */
  stripConfig(str) {
    const configRegex = new RegExp(
      `.*${this.optionMarker}\\s*(?<json>{.*}).*`,
      "gi"
    );
    return str.replace(configRegex, "");
  }
}

module.exports = ScafflaterOptions;
