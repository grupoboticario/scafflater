import LocalFolderTemplateSource from "../local-folder-template-source/local-folder-template-source.js";
import fsUtil from "../../fs-util/index.js";
import ScafflaterOptions from "../../options/index.js";
import { LocalTemplate } from "../../scafflater-config/local-template.js";
import Source from "../../scafflater-config/source.js";
import {
  TemplateDefinitionNotFound,
  ScafflaterFileNotFoundError,
} from "../../errors/index.js";
import { promisify } from "util";
import {
  GithubClientNotInstalledError,
  GithubClientUserNotLoggedError,
} from "./errors/index.js";
import { exec } from "child_process";

const execAsync = promisify(exec);
const repoRegex =
  /(https:\/\/github.com\/|git@github.com:|^)(?<org>[a-z0-9_\-.]+)\/(?<repo>[a-z0-9_\-.]+)/;

export default class GithubClientTemplateSource extends LocalFolderTemplateSource {
  /**
   * Checks if the sourceKey is valid for this TemplateSource
   * @param {string} sourceKey - The source key to be validated.
   * @returns {boolean} Returns true if the key is valid
   */
  static isValidSourceKey(sourceKey) {
    return repoRegex.test(sourceKey);
  }

  /**
   * Template Source constructor.
   * @param {?ScafflaterOptions} options - Scafflater options. If null, will get the default configuration.
   */
  constructor(options = {}) {
    super(options);
  }

  /**
   * Parse the github address to get repo and org names
   * @param {string} repo Template repository address
   * @returns {object} An object containing the org and repo names
   */
  static parseRepoAddress(repo) {
    const match = repoRegex.exec(repo);

    return {
      org: match.groups.org,
      repo: match.groups.repo.replace(/\.git$/, ""),
    };
  }

  /**
   * Checks if the GH client is installed and authenticated
   * @returns {Promise<boolean>} True if the authentication is ok.
   */
  static async checkGhClient() {
    try {
      await execAsync("gh auth status");
      return true;
    } catch (error) {
      if (error.message.match(/command not found/gi)) {
        throw new GithubClientNotInstalledError();
      }
      if (error.message.match(/You are not logged into any GitHub hosts/gi)) {
        throw new GithubClientUserNotLoggedError();
      }
      throw error;
    }
  }

  /**
   * Gets the template and copies it in a local folder.
   * @param {string} sourceKey - The source key (<OWNER>/<REPOSITORY>) of template.
   * @param {string} version - The template version
   * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
   * @returns {Promise<LocalTemplate>} The local template
   */
  async getTemplate(sourceKey, version = "head", outputDir = null) {
    // @TODO Implement version control
    await GithubClientTemplateSource.checkGhClient();
    const pathToClone = fsUtil.getTempFolderSync();
    const { org, repo } =
      GithubClientTemplateSource.parseRepoAddress(sourceKey);

    await execAsync(`gh repo clone ${org}/${repo} ${pathToClone}`);

    try {
      return await super.getTemplate(pathToClone, version, outputDir);
    } catch (error) {
      if (error instanceof ScafflaterFileNotFoundError) {
        throw new ScafflaterFileNotFoundError(
          `${sourceKey}/.scafflater/scafflater.jsonc`,
        );
      }
      if (error instanceof TemplateDefinitionNotFound) {
        throw new TemplateDefinitionNotFound(
          `${sourceKey}/.scafflater/scafflater.jsonc`,
        );
      }
      throw error;
    }
  }

  /**
   * Gets an Source object for this source
   * @param {string} key The source key
   * @returns {Source} An Source object
   */
  getSource(key) {
    return new Source("github", key, {
      baseUrl: this.options.githubBaseUrl,
      baseUrlApi: this.options.githubBaseUrlApi,
    });
  }
}
