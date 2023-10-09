import ScafflaterOptions from "../options/index.js";
import ParameterConfig from "./parameter-config.js";

/**
 * @class TemplateHooks
 * @description Defines the hooks scripts for templates
 */
export class TemplateHooks {
  /**
   * Pre Run script
   *
   * @description Script to be run before template init
   * @type {string}
   */
  preRun;

  /**
   * Pot Run script
   *
   * @description Script to be run before template init
   * @type {string}
   */
  postRun;
}

/**
 * @class TemplateInfo
 * @description Describes a template config
 */
export default class TemplateConfig {
  /**
   * Creates a template
   *
   * @param {string} name - Template name
   * @param {string} version - Template version
   * @param {?string} description - Template description
   * @param {?(ScafflaterOptions|object)} options - Template options
   * @param {?object[]} parameters - Template parameters
   * @param {?string[]} persistentParameters - List of parameters that should be saved to be used on future executions
   * @param {?TemplateHooks} hooks - Template hooks
   */
  constructor(
    name,
    version,
    description = null,
    options = {},
    parameters = [],
    persistentParameters = [],
    hooks = {}
  ) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.options = options;
    this.parameters = parameters;
    this.persistentParameters = persistentParameters;
    this.hooks = hooks;
  }

  /**
   * Template name
   *
   * @description The template name must follow the pattern [a-z-]{3,}
   * @type {string}
   */
  name;

  /**
   * Template description
   *
   * @type {string}
   */
  description;

  /**
   * Template version
   *
   * @description Should follow the semver patterns (https://semver.org/)
   * @type {string}
   */
  version;

  /**
   * Scafflater Options to generate template
   *
   * @type {ScafflaterOptions}
   */
  options;

  /**
   * Parameters to generate template.
   *
   * @description Scafflater uses Inquirer to get the parameters through scafflater-cli. The objects in this list must be assigned to inquirer question object(https://github.com/SBoudrias/Inquirer.js#questions).
   * @type {ParameterConfig[]}
   */
  parameters;

  /**
   * Template hooks
   *
   * @description Template hooks scripts
   * @type {TemplateHooks}
   */
  hooks;
}
