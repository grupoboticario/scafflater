const ScafflaterOptions = require("../options");

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
   */
  constructor(name, description = null, options = {}, parameters = []) {
    this.name = name;
    this.description = description;
    this.options = options;
    this.parameters = parameters;
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
   * @type {object[]}
   */
  parameters;
}

module.exports = { PartialConfig };
