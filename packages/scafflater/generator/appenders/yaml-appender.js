import Appender from "./appender.js";
import YAML, { YAMLMap, Scalar, YAMLSeq } from "yaml";
import merge from "deepmerge";

/**
 * Combine arrays. Combine the array item by item.
 * @param {object[]} target The target array
 * @param {object[]} source Source array
 * @param context
 * @returns {object[]} The result array
 */
const combineMerge = (target, source, context) => {
  const destination = target.slice();

  source.forEach((item, index) => {
    if (typeof destination[index] === "undefined") {
      destination[index] = item;
    } else if (
      destination[index] instanceof YAMLMap &&
      item instanceof YAMLMap
    ) {
      destination[index] = deepMerge(target[index], item, context);
    } else {
      if (item instanceof Scalar) {
        const targetItem = target.find((t) => t.value === item.value);
        if (!targetItem) {
          destination.push(item);
        }
      }
    }
  });
  return destination;
};

const concatMerge = (target, source, context) => {
  return target.slice().concat(source.slice());
};

const replaceMerge = (target, source, context) => {
  return source;
};

const keyMerge = (target, source, context) => {
  const reKeyName = /key\((?<keyName>.*)\)/gi;
  const m = reKeyName.exec(context.options.arrayAppendStrategy);
  const keyName =
    m && m.length > 0 ? m.groups.keyName : context.options.arrayAppendStrategy;

  const destination = target.slice();

  source.forEach((item) => {
    const keyValue = item.items.find((i) => i.key.value === keyName)?.value;
    if (!keyValue) {
      destination.push(item);
      return;
    }

    const index = destination.findIndex(
      (d) =>
        d.items.find((i) => i.key.value === keyName)?.value.value ===
        keyValue.value,
    );

    if (index <= -1) {
      destination.push(item);
    } else {
      destination[index] = deepMerge(item, destination[index], context);
    }
  });
  return destination;
};

const concatComments = (...comments) => {
  comments = comments.filter((c) => c && c.length > 0);
  if (comments.length <= 0) return undefined;
  return comments.join("\n");
};

const deepMerge = (target, source, context) => {
  if (source == null) return target;
  if (target == null) return source;

  if (source instanceof YAMLMap && target instanceof YAMLMap) {
    const result = new YAMLMap();

    // including comments
    result.commentBefore = concatComments(
      source.commentBefore,
      target.commentBefore,
    );
    result.comment = concatComments(source.comment, target.comment);

    source.items.forEach((item) => {
      const targetItem = target.items.find(
        (i) => i.key.value === item.key.value,
      );
      if (targetItem) {
        targetItem.value = deepMerge(targetItem.value, item.value, context);
        result.items.push(targetItem);
      } else {
        result.items.push(item);
      }
    });

    // including items from target that are not in source
    target.items.forEach((item) => {
      const sourceItem = source.items.find(
        (i) => i.key.value === item.key.value,
      );
      if (!sourceItem) {
        result.items.push(item);
      }
    });

    return result;
  }

  if (source instanceof YAMLSeq && target instanceof YAMLSeq) {
    const result = new YAMLSeq();

    // including comments
    result.commentBefore = source.commentBefore ?? target.commentBefore;
    result.comment = source.comment ?? target.comment;

    switch (context.options.arrayAppendStrategy) {
      case "combine":
        result.items = combineMerge(target.items, source.items, context);
        break;
      case "concat":
        result.items = concatMerge(target.items, source.items, context);
        break;
      case "replace":
        result.items = replaceMerge(target.items, source.items, context);
        break;
      case "ignore":
        if (target.items.length > 0) {
          result.items = target.items;
        } else {
          result.items = source.items;
        }
        break;
      default:
        result.items = keyMerge(target.items, source.items, context);
        break;
    }

    return result;
  }

  return source;
};

export default class YamlAppender extends Appender {
  /**
   * Process the input.
   * @param {object} context The context of generation
   * @param {string} srcStr The string to be appended
   * @param {string} destStr The string where srcStr must be appended
   * @returns {Promise<object>} The process result
   */
  append(context, srcStr, destStr) {
    return new Promise((resolve, reject) => {
      try {
        let src = YAML.parseDocument(srcStr);
        let dst = YAML.parseDocument(destStr);
        src = src ?? {};
        dst = dst ?? {};

        const result = deepMerge(dst.contents, src.contents, context);

        src.contents = result;
        resolve({
          context,
          result: src.toString(),
          notAppended: "",
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
