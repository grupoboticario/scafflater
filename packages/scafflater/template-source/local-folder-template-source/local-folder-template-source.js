const TemplateSource = require("../template-source");
const fsUtil = require("../../fs-util");
const path = require("path");
const { LocalTemplate } = require("../../scafflater-config/local-template");
const { ScafflaterOptions } = require("../../options");
const { Source } = require("../../scafflater-config/source");
const ScafflaterFileNotFoundError = require("../../errors/scafflater-file-not-found-error");
const TemplateDefinitionNotFound = require("../../errors/template-definition-not-found-error");

class LocalFolderTemplateSource extends TemplateSource {
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
    if (version) {
      console.warn("Versions are ignored for local template sources");
    }
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

module.exports = LocalFolderTemplateSource;
