/**
 * @class ParameterConfig
 * @description Describes a parameter. This object accept all parameters to get parameter from user through inquirer.
 */
class ParameterConfig {
  /**
   * Creates a parameter
   *
   * @param {string} name - Parameter name
   * @param {?"partial"|"template"|"global"} scope - Parameter Scope.
   *  For template and global scopes, the parameter will be saved to be used on future executions.
   *  If template, the value will be loaded and available for any partial of the same template.
   *  If global, the value will be loaded and available for any partial of any template in this folder.
   */
  constructor(name, scope = "partial") {
    this.name = name;
    this.scope = scope;
  }

  /**
   * Parameter name
   *
   * @description The template name must follow the pattern [a-z-]{3,}
   * @type {string}
   */
  name;

  /**
   * Parameter Scope
   *
   * @description For template and global scopes, the parameter will be saved to be used on future executions.
   *  If template, the value will be loaded and available for any partial of the same template.
   *  If global, the value will be loaded and available for any partial of any template in this folder.
   * @type {?"partial"|"template"|"global"}
   */
  scope;
}

module.exports = { ParameterConfig };
