const merge = require("deepmerge");

/**
 * Combine arrays. Combine the array item by item.
 *
 * @param {object[]} target The target array
 * @param {object[]} source Source array
 * @param {object} options options
 * @returns {object[]} The result array
 */
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

const concatMerge = (target, source, options) => {
  return target.slice().concat(source.slice());
};

const replaceMerge = (target, source, options) => {
  return source;
};

/**
 * Replace arrays
 *
 *
 * @param {object[]} target The target array
 * @param {object[]} source Source array
 * @param {object} options options
 * @returns {object[]} The result array
 */
const ignoreMerge = (target, source, options) => {
  if (target && target.length > 0) {
    return target;
  }

  return source;
};

const keyMerge = (target, source, options) => {
  const reKeyName = /key\((?<keyName>.*)\)/gi;
  const m = reKeyName.exec(options.strategy);
  const keyName = m && m.length > 0 ? m.groups.keyName : options.strategy;

  const destination = target.slice();

  source.forEach((item) => {
    if (!item[keyName]) {
      destination.push(item);
      return;
    }

    const index = destination.findIndex((e) => e[keyName] === item[keyName]);

    if (index <= -1) {
      destination.push(options.cloneUnlessOtherwiseSpecified(item, options));
    } else if (options.isMergeableObject(item)) {
      destination[index] = merge(target[index], item, options);
    } else if (target.indexOf(item) === -1) {
      destination.push(item);
    }
  });
  return destination;
};

/**
 * Merge Arrays
 *
 * @param target Target Array
 * @param source Source Array
 * @param options options.strategy: Action to include generated code on target:
 *  - combine: The array will be combine item per item (Default)
 *  - concat: The arrays will be concatenated
 *  - replace: The source array will replace the target array
 *  - ignore: If the destination exists and is not empty, will ignore the source array.
 *  - key<keyName>: will use keyName as item key to merge arrays. The object of source will replace the object with the same key value on target.
 * @returns {object[]}
 */
const arrayMerge = (target, source, options) => {
  switch (options.strategy) {
    case "combine":
      return combineMerge(target, source, options);
    case "concat":
      return concatMerge(target, source, options);
    case "replace":
      return replaceMerge(target, source, options);
    case "ignore":
      return ignoreMerge(target, source, options);
    default:
      return keyMerge(target, source, options);
  }
};

module.exports = arrayMerge;
