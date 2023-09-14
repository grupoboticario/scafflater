import Appender from "./appender";
import yaml from "js-yaml";
import merge from "deepmerge";
import arrayMerge from "./utils/array-merger";

export default class YamlAppender extends Appender {
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
        let src = yaml.load(srcStr);
        let dst = yaml.load(destStr);
        src = src ?? {};
        dst = dst ?? {};

        src = merge(dst, src, {
          arrayMerge,
          strategy: context.options.arrayAppendStrategy,
        });

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
