const Handlebars = require("handlebars");
const ScafflaterOptions = require("../options");

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

module.exports = {
  maskParameters,
  buildLineComment,
};
