import Source from "./source";
import RanPartial from "./ran-partial";
import PersistedParameter from "./persisted-parameter";

/**
 * @class RanTemplate
 * @description Has information about how an template was generated.
 */
export default class RanTemplate {
  /**
   * Creates a template
   *
   * @param {string} name - Template name
   * @param {string} version - Template version
   * @param {Source} source - Generated Template Source
   * @param {object[]} parameters - Template parameters
   * @param {RanPartial[]} partials - Generated partials for this template
   * @param {PersistedParameter[]} templateParameters List of saved template parameters to be used on future executions
   */
  constructor(
    name,
    version,
    source,
    parameters = {},
    partials = [],
    templateParameters = []
  ) {
    this.name = name;
    this.version = version;
    this.source = source;
    this.parameters = parameters;
    this.partials = partials;
    this.templateParameters = templateParameters;
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

  /**
   * Saved template parameters to be used on future executions.
   *
   * @type {object}
   */
  templateParameters;
}
