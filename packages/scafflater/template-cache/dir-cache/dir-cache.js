import TemplateCache from "../template-cache.js";
import path from "path";
import fsUtil from "../../fs-util/index.js";
import sort from "version-sort";
import { LocalTemplate } from "../../scafflater-config/local-template.js";

/**
 * Stores templates in the local file system
 * @augments TemplateCache
 */
export default class DirCache extends TemplateCache {
  constructor(storagePath, config = {}) {
    super(config);
    this.storagePath = storagePath;
  }

  /**
   * Gets an template in cache
   * @param {string} templateName The template name
   * @param {string} templateVersion The template version. If null, gets the latest available version.
   * @returns {Promise<LocalTemplate>} The local template
   */
  async getTemplate(templateName, templateVersion = null) {
    if (!(await fsUtil.pathExists(this.storagePath))) {
      return null;
    }

    const templates = (
      await LocalTemplate.loadFromPath(this.storagePath)
    )?.filter((t) => t.name === templateName);

    if (templateVersion) {
      return (
        templates?.find(
          (t) => t.name === templateName && t.version === templateVersion,
        ) ?? null
      );
    }

    const mostRecentVersion = sort(templates.map((t) => t.version))[
      templates.length - 1
    ];
    return (
      templates.find(
        (t) => t.name === templateName && t.version === mostRecentVersion,
      ) ?? null
    );
  }

  /**
   * Stores the template in the local file system.
   * @param {string} templatePath - Path of template
   * @param {string} templateVersion - Template version
   * @returns {Promise<string>} The path where template was cached.
   */
  async storeTemplate(templatePath, templateVersion = null) {
    const templateConfig = (await LocalTemplate.loadFromPath(templatePath))[0];
    const cachePath = path.join(
      this.storagePath,
      templateConfig.name,
      templateVersion || templateConfig.version,
    );
    await fsUtil.ensureDir(cachePath);
    await fsUtil.copy(templatePath, cachePath);
    return Promise.resolve((await LocalTemplate.loadFromPath(cachePath))[0]);
  }

  /**
   * List stored templates and their versions.
   * @returns {Promise<LocalTemplate[]>} All the templates in cache
   */
  async listCachedTemplates() {
    return LocalTemplate.loadFromPath(this.storagePath);
  }
}
