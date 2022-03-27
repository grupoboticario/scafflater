const ScafflaterOptions = require("../options");
const ParameterConfig = require("./parameter-config");

/**
 * @class TemplateInfo
 * @description Describes a template config
 */
class TemplateConfig {
  /**
   * Creates a template
   *
   * @param {string} name - Template name
   * @param {string} version - Template version
   * @param {?string} description - Template description
   * @param {?(ScafflaterOptions|object)} options - Template options
   * @param {?object[]} parameters - Template parameters
   * @param {?string[]} persistentParameters - List of parameters that should be saved to be used on future executions
   */
  constructor(
    name,
    version,
    description = null,
    options = {},
    parameters = [],
    persistentParameters = []
  ) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.options = options;
    this.parameters = parameters;
    this.persistentParameters = persistentParameters;
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
}

module.exports = { TemplateConfig };
