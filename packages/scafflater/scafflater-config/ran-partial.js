/**
 * @class RanPartial
 * @description Has information about how an partial was generated.
 */
export default class RanPartial {
  /**
   * Creates a template
   * @param {string} name - Template name
   * @param {object[]} parameters - Template parameters
   */
  constructor(name, parameters = {}) {
    this.name = name;
    this.parameters = parameters;
  }

  /**
   * Template name
   * @description The template name must follow the pattern [a-z-]{3,}
   * @type {string}
   */
  name;

  /**
   * Parameters used to generate partial.
   * @type {object}
   */
  parameters;
}
