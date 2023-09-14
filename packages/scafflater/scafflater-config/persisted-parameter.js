/**
 * @class PersistedParameter
 * @description Describes a persisted parameter. It will be used to store parameter for global and template scopes
 */
export default class PersistedParameter {
  /**
   * Creates a parameter
   *
   * @param {string} name - Parameter name
   * @param {?object} value - Parameter Value.
   */
  constructor(name, value = undefined) {
    this.name = name;
    this.value = value;
  }

  /**
   * Parameter name
   *
   * @description The template name must follow the pattern [a-z-]{3,}
   * @type {string}
   */
  name;

  /**
   * Parameter value
   *
   * @type {?object}
   */
  value;

  /**
   * Convert a array of PersistedParameter or ParameterConfig
   *
   * @param {PersistedParameter[]} parameters Array of persisted parameters
   * @returns {object} An object of reduced parameters
   */
  static reduceParameters(parameters) {
    return parameters.reduce((obj, item) => {
      obj[item.name] = item.value;
      return obj;
    }, {});
  }

  /**
   * Update the parameter value of persisted parameter in an array
   *
   * @param {PersistedParameter[]} parameters The persisted parameter array
   * @param {PersistedParameter} newParameterValue The new parameter to be persisted
   */
  static updateParameters(parameters, newParameterValue) {
    const index = parameters.findIndex(
      (p) => p.name === newParameterValue.name
    );

    if (index < 0) {
      parameters.push(newParameterValue);
    } else {
      parameters[index].value = newParameterValue.value;
    }
  }
}
