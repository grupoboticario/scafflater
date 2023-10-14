import ScafflaterOptions from "../options/index.js";
import { LocalTemplate } from "../scafflater-config/local-template.js";

// TODO: include source as part of template key

/**
 * TemplateCache.
 *
 * @class TemplateCache
 * @abstract
 */
export default class TemplateCache {
  /**
   * Template Source constructor should not been called.
   *
   * @param {ScafflaterOptions} options The Scafflater Options
   */
  constructor(options) {
    if (this.constructor === TemplateCache) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.options = new ScafflaterOptions(options);
  }

  /**
   * Returns the template source instance to be used to get templates.
   *
   * @param {?ScafflaterOptions} options - Scafflater configuration. If null, will get the default configuration.
   * @returns {Promise<TemplateCache>} An specialized instance of TemplateStorage.
   */
  static async getTemplateCache(options = {}) {
    options = new ScafflaterOptions(options);

    if (!options.cacheStorages[options.cacheStorage]) {
      throw new Error(`There's no module for source '${options.cacheStorage}'`);
    }

    const CacheStorage = (
      await import(options.cacheStorages[options.cacheStorage])
    ).default;
    return new CacheStorage(options);
  }

  /**
   * Gets an template in cache
   *
   * @param {string} templateName The template name
   * @param {string} templateVersion The template version. If null, gets the latest available version.
   * @returns {Promise<LocalTemplate>} The local template
   */
  async getTemplate(templateName, templateVersion = null) {
    throw new Error("Method 'getTemplate()' must be implemented.");
  }

  /**
   * Stores the template.
   *
   * @param {string} path - Path of template
   * @param {string} version - Template version
   * @returns {Promise<LocalTemplate>} The cache template path
   */
  async storeTemplate(path, version) {
    throw new Error("Method 'storeTemplate()' must be implemented.");
  }

  /**
   * List stored templates and their versions.
   *
   * @returns {LocalTemplate[]} All cached templates
   */
  async listCachedTemplates() {
    throw new Error("Method 'listCachedTemplates()' must be implemented.");
  }
}
