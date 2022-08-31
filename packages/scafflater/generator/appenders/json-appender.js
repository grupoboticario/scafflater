const Appender = require("./appender");
const merge = require("deepmerge");
const arrayMerge = require("./utils/array-merger");
const stripJsonComments = require("strip-json-comments");

class JsonAppender extends Appender {
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
        srcStr = stripJsonComments(srcStr).trim();
        destStr = stripJsonComments(destStr).trim();

        let src = srcStr ? JSON.parse(srcStr) : {};
        const dst = destStr ? JSON.parse(destStr) : {};

        src = merge(dst, src, {
          arrayMerge,
          strategy: context.options.arrayAppendStrategy,
        });

        resolve({
          context,
          result: JSON.stringify(src),
          notAppended: "",
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = JsonAppender;
