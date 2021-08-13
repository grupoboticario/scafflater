const Handlebars = require("handlebars");
const { ScafflaterOptions } = require("../options");
const ignore = require("ignore");

/**
 * Checks on template or partial parameters which must be masked, and mask it
 *
 * @param {object} parameters The parameters received for generation
 * @param {object[]} templateParameters The parameters of template or partial
 * @returns {object} The an object with masked parameters
 */
const maskParameters = (parameters, templateParameters) => {
  if (!templateParameters || !parameters) return parameters;

  for (const p of templateParameters) {
    if (p.mask) {
      parameters[p.name] = "******";
    }
  }

  return parameters;
};

/**
 * Builds a line comment based on config.lineCommentTemplate.
 *
 * @param {ScafflaterOptions} options - The configuration
 * @param {string} comment - The comment content
 * @returns {string} The comment
 */
const buildLineComment = (options, comment) => {
  return Handlebars.compile(options.lineCommentTemplate, { noEscape: true })({
    comment,
  });
};

/**
 *
 * @param {string} basePath The base path to be analysed
 * @param {string} folderOrFile The folder or file path
 * @param {string[]} patterns Patterns to ignore
 * @returns {boolean} True if path must be ignored
 */
const ignores = (basePath, folderOrFile, patterns) => {
  const pathsToIgnore = ignore().add(patterns);
  const relativePath = folderOrFile.replace(basePath, "").replace(/^\//, "");
  return relativePath !== "" && pathsToIgnore.ignores(relativePath);
};

module.exports = {
  maskParameters,
  buildLineComment,
  ignores,
};
