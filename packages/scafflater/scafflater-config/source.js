/**
 * @class Source
 * @description The source from where Generated template was got.
 */
class Source {
  /**
   * Creates a Source
   *
   * @param {string} name - Source name
   * @param {string} key - Source key
   * @param {object} options - Source options
   */
  constructor(name, key, options = {}) {
    this.name = name;
    this.key = key;
    this.options = options;
  }

  /**
   * Source name
   *
   * @description The source name. Used to resolve TemplateSource
   * @type {string}
   */
  name;

  /**
   * Source key
   *
   * @description The key of template in the TemplateSource. For example, Github template source uses repo url as key.
   * @type {string}
   */
  key;

  /**
   * Source options
   *
   * @description Additional configuration to be used by Template Sources. It can contains address and tokens required by template source.
   * @type {string}
   */
  options;
}

module.exports = Source;
