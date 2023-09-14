import TemplateSource from "../template-source";
import fsUtil from "../../fs-util";
import path from "path";
import { LocalTemplate } from "../../scafflater-config/local-template";
import ScafflaterOptions from "../../options";
import Source from "../../scafflater-config/source";
import {
  ScafflaterFileNotFoundError,
  TemplateDefinitionNotFound,
} from "../../errors";

export default class LocalFolderTemplateSource extends TemplateSource {
  /**
   * Checks if the sourceKey is valid for this TemplateSource
   *
   * @param {string} sourceKey - The source key to be validated.
   * @returns {boolean} Returns true if the key is valid
   */
  static isValidSourceKey(sourceKey) {
    return fsUtil.pathExistsSync(sourceKey);
  }

  /**
   * Template Source constructor.
   *
   * @param {ScafflaterOptions} options - Scafflater configuration. If null, will get the default configuration.
   */
  constructor(options = {}) {
    super(options);
    this.options.ignore = [".git", "node_modules"];
  }

  /**
   * Gets the template and copies it in a local folder.
   *
   * @param {string} sourceKey - The source key (<OWNER>/<REPOSITORY>) of template.
   * @param {string} version - The template version. This parameter is ignored for local template sources.
   * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
   * @returns {Promise<LocalTemplate>} The local template
   */
  async getTemplate(sourceKey, version = null, outputDir = null) {
    const out = outputDir || (await fsUtil.getTempFolder());

    const _this = this;
    await fsUtil.copy(sourceKey, out, {
      filter: function (sourcePath) {
        return !_this.options.ignores(sourceKey, sourcePath);
      },
    });

    const outConfigFolder = path.resolve(out, ".scafflater");
    const outConfigPath = path.resolve(out, ".scafflater", "scafflater.jsonc");
    if (!(await fsUtil.pathExists(outConfigPath))) {
      throw new ScafflaterFileNotFoundError(
        `${sourceKey}/.scafflater/scafflater.jsonc`
      );
    }

    const availableTemplates = await LocalTemplate.loadFromPath(
      outConfigFolder
    );
    if (!availableTemplates || availableTemplates.length <= 0) {
      throw new TemplateDefinitionNotFound(
        `${sourceKey}/.scafflater/scafflater.jsonc`
      );
    }

    return Promise.resolve(availableTemplates[0]);
  }

  /**
   * Gets an Source object for this source
   *
   * @param {string} key The source key
   * @returns {Source} An Source object
   */
  getSource(key) {
    return new Source("localFolder", key);
  }
}
