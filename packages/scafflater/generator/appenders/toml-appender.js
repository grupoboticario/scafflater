const Appender = require("./appender");
const TOML = require("@ltd/j-toml");
const arrayMerge = require("./utils/array-merger");
const merge = require("lodash.mergewith");

class TomlAppender extends Appender {
  /**
   * Combine arrays
   *
   * @param {object[]} target The target array
   * @param {object[]} source Source array
   * @param {object} options options
   * @returns {object[]} The result array
   */
  combineMerge(target, source, options) {
    const destination = target.slice();

    source.forEach((item, index) => {
      if (typeof destination[index] === "undefined") {
        destination[index] = options.cloneUnlessOtherwiseSpecified(
          item,
          options
        );
      } else if (options.isMergeableObject(item)) {
        destination[index] = merge(target[index], item, options);
      } else if (target.indexOf(item) === -1) {
        destination.push(item);
      }
    });
    return destination;
  }

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
        let src = TOML.parse(srcStr);
        const dst = TOML.parse(destStr);

        const customizer = (objValue, srcValue) => {
          if (Array.isArray(objValue)) {
            return arrayMerge(
              objValue,
              srcValue,
              context.options.arrayAppendStrategy
            );
          }
          if (typeof objValue === "object") {
            return merge(objValue, srcValue, customizer);
          }
          return srcValue;
        };

        src = merge(dst, src, customizer);

        resolve({
          context,
          result: TOML.stringify(src, {
            newline: "\n",
            newlineAround: "section",
          }),
          notAppended: "",
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = TomlAppender;
