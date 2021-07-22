const Source = require("./source");
const RanPartial = require("./ran-partial");

/**
 * @class RanTemplate
 * @description Has information about how an template was generated.
 */
class RanTemplate {
  /**
   * Creates a template
   *
   * @param {string} name - Template name
   * @param {string} version - Template version
   * @param {Source} source - Generated Template Source
   * @param {object[]} parameters - Template parameters
   * @param {RanPartial[]} partials - Generated partials for this template
   */
  constructor(name, version, source, parameters = {}, partials = []) {
    this.name = name;
    this.version = version;
    this.source = source;
    this.parameters = parameters;
    this.partials = partials;
  }

  /**
   * Template name
   *
   * @description The template name must follow the pattern [a-z-]{3,}
   * @type {string}
   */
  name;

  /**
   * Template version
   *
   * @description Should follow the semver patterns (https://semver.org/)
   * @type {string}
   */
  version;

  /**
   * Generated template source
   *
   * @type {Source}
   */
  source;

  /**
   * Generated partials for this template.
   *
   * @type {RanPartial[]}
   */
  partials;

  /**
   * Parameters used to generate template.
   *
   * @type {object}
   */
  parameters;
}

module.exports = RanTemplate;
