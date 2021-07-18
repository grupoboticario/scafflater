const Handlebars = require("handlebars");

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
 * @param {ScafflaterOptions} options - The configuration
 * @param {string} comment - The comment content
 * @return {string} The comment
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
