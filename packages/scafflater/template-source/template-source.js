import ScafflaterOptions from "../options";
import { LocalTemplate } from "../scafflater-config/local-template";
import Source from "../scafflater-config/source";
import { CannotGetSourceError } from "./errors";

/**
 * TemplateSource factory.
 */
export default class TemplateSource {
  /**
   * Template Source constructor.
   *
   * @param {?ScafflaterOptions} options - Scafflater Options. If null, will get the default options.
   */
  constructor(options = {}) {
    if (this.constructor === TemplateSource) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.options = new ScafflaterOptions(options);
    this.source = this.options.source;
  }

  /**
   * The source name.
   *
   * @type {string}
   */
  source;

  /**
   * Resolves the template source from source key.
   *
   * @param {ScafflaterOptions} options The Scafflater Options
   * @param {string} sourceKey - The key of source path. Ir can be a local folder path, a git url, or other path that is recognized by template source through isValidSourceKey function
   * @returns {Promise<TemplateSource>} An specialized instance of TemplateSource.
   */
  static async resolveTemplateSourceFromSourceKey(options, sourceKey) {
    const validSources = [];
    for (const source in options.sources) {
      const s = (await import(options.sources[source])).default;
      if (s.isValidSourceKey(sourceKey)) {
        validSources.push(source);
      }
    }
    const sourceIndex = validSources.indexOf(options.source);
    if (sourceIndex >= 0) {
      return new (
        await import(options.sources[validSources[sourceIndex]])
      ).default(options);
    }
    if (validSources.length > 0) {
      return new (await import(options.sources[validSources[0]])).default(
        options
      );
    }

    throw new CannotGetSourceError(sourceKey);
  }

  /**
   * Returns the template source instance to be used to get templates.
   *
   * @param {?object} config - Scafflater configuration. If null, will get the default configuration.
   * @returns {Promise<TemplateSource>} An specialized instance of TemplateSource.
   */
  static async getTemplateSource(config) {
    config = { ...new ScafflaterOptions(), ...config };

    if (!config.sources[config.source]) {
      throw new Error(`There's no module for source '${config.source}'`);
    }

    return new (await import(config.sources[config.source])).default(config);
  }

  /**
   * Gets the template and copies it in a local folder.
   *
   * @param {string} sourceKey - The source key of template. Will vary, depending on template source
   * @param {string} version - The template version
   * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
   * @returns {Promise<LocalTemplate>} The local template
   */
  async getTemplate(sourceKey, version = "latest", outputDir = null) {
    throw new Error("Method 'getTemplate()' must be implemented.");
  }

  /**
   * Checks if version is available.
   *
   * @param {string} sourceKey - The source key of template. Will vary, depending on template source
   * @param {string} version - The template version
   * @returns {Promise<boolean>} true if the version is available
   */
  async isVersionAvailable(sourceKey, version) {
    throw new Error("Method 'isVersionAvaiable()' must be implemented.");
  }

  /**
   * Gets an Source object for this source
   *
   * @param {string} key The source key
   * @returns {Source} An Source object
   */
  getSource(key) {
    return TemplateSource.getTemplateSource().getSource(key);
  }
}
