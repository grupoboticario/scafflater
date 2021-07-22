const Appender = require("./appender");
const yaml = require("js-yaml");
const merge = require("deepmerge");

class YamlAppender extends Appender {
  /**
   * Process the input.
   *
   * @param {object} context The context of generation
   * @param {string} srcStr The string to be appended
   * @param {string} destStr The string where srcStr must be appended
   * @returns {Promise<object>} The process result
   */
  append(context, srcStr, destStr) {
    return new Promise((resolve, reject) => {
      try {
        let src = yaml.load(srcStr);
        const dst = yaml.load(destStr);

        src = merge(dst, src);

        resolve({
          context,
          result: yaml.dump(src),
          notAppended: "",
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = YamlAppender;
