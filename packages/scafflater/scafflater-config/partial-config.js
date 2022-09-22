const ScafflaterOptions = require("../options");
const ParameterConfig = require("./parameter-config");

/**
 * @class PartialHooks
 * @description Defines the hooks scripts for partials
 */
class PartialHooks {
  /**
   * Pre Run script
   *
   * @description Script to be run before partial run
   * @type {string}
   */
  preRun;

  /**
   * Pot Run script
   *
   * @description Script to be run after partial run
   * @type {string}
   */
  postRun;
}

/**
 * @class PartialConfig
 * @description Describes a partial Config
 */
class PartialConfig {
  /**
   * Creates a Partial
   *
   * @param {string} name - Partial name
   * @param {?string} description - Partial description
   * @param {?(ScafflaterOptions|object)} options - Partial options
   * @param {?object[]} parameters - Partial parameters
   * @param {?string[]} persistentParameters - List of parameters that should be saved to be used on future executions
   * @param {?PartialHooks} hooks - Partial hooks
   */
  constructor(
    name,
    description = null,
    options = {},
    parameters = [],
    persistentParameters = [],
    hooks = {}
  ) {
    this.name = name;
    this.description = description;
    this.options = options;
    this.parameters = parameters;
    this.persistentParameters = persistentParameters;
    this.hooks = hooks;
  }

  /**
   * Partial name
   *
   * @description The Partial name must follow the pattern [a-z-]{3,}
   * @type {string}
   */
  name;

  /**
   * Partial description
   *
   * @type {string}
   */
  description;

  /**
   * Scafflater Options to generate partial
   *
   * @type {ScafflaterOptions}
   */
  options;

  /**
   * Parameters to generate partial.
   *
   * @description Scafflater uses Inquirer to get the parameters through scafflater-cli. The objects in this list must be assigned to inquirer question object(https://github.com/SBoudrias/Inquirer.js#questions).
   * @type {ParameterConfig[]}
   */
  parameters;

  /**
   * Partial hooks
   *
   * @description Partial hooks scripts
   * @type {PartialHooks}
   */
  hooks;
}

module.exports = { PartialConfig };
