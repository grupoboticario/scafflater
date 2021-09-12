const Appender = require("./appender");
const yaml = require("js-yaml");
const merge = require("deepmerge");

const combineMerge = (target, source, options) => {
  const destination = target.slice();

  source.forEach((item, index) => {
    if (typeof destination[index] === "undefined") {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
    } else if (options.isMergeableObject(item)) {
      destination[index] = merge(target[index], item, options);
    } else if (target.indexOf(item) === -1) {
      destination.push(item);
    }
  });
  return destination;
};

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

        src = merge(dst, src, { arrayMerge: combineMerge });

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
