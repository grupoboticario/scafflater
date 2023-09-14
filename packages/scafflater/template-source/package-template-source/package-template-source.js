import LocalFolderTemplateSource from "../local-folder-template-source";
import util from "util";
import ScafflaterFileNotFoundError from "../../errors/scafflater-file-not-found-error";
import { TemplateDefinitionNotFound } from "../../errors";
import logger from "winston";
import fsUtil from "../../fs-util";
import { exec as execSync } from "child_process";

/**
 * Gets the template and copies it in a local folder.
 *
 * @param {string} sourceKey - The source key of template. Will vary, depending on template source
 * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
 * @returns {Promise<LocalTemplate>} The local template
 */
export default class PackageTemplateSource extends LocalFolderTemplateSource {
  async getTemplate(sourceKey, outputDir = null) {
    try {
      const exec = util.promisify(execSync);
      const tempPath = fsUtil.getTempFolderSync();

      const packageStatus = await exec(
        `cd ${tempPath} && npm pack ${sourceKey}`,
        {
          timeout: 30000,
        }
      );

      await exec(
        `cd ${tempPath} && tar -xvzf ${packageStatus.stdout.replace("/n", "")}`,
        {
          timeout: 30000,
        }
      );

      await exec(`cd ${tempPath}/package && npm install -D ${sourceKey}`, {
        timeout: 60000,
      });

      const pathToClone = `${tempPath}/package`;

      return await super.getTemplate(pathToClone, outputDir);
    } catch (error) {
      if (error instanceof ScafflaterFileNotFoundError) {
        throw new ScafflaterFileNotFoundError(
          `${sourceKey}/.scafflater/scafflater.jsonc`
        );
      }
      if (error instanceof TemplateDefinitionNotFound) {
        throw new TemplateDefinitionNotFound(
          `${sourceKey}/.scafflater/scafflater.jsonc`
        );
      }
      throw error;
    }
  }

  static async isValidSourceKey(sourceKey) {
    try {
      const exec = util.promisify(require("child_process").exec);
      await exec(`npm view ${sourceKey}`, {
        timeout: 30000,
      });
      return true;
    } catch (error) {
      if (error.message.includes("404")) {
        return false;
      }
      logger.error(error.message);
    }
  }
}
