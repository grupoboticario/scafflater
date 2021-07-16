const OptionsProvider = require("../options-provider");
const Handlebars = require("handlebars");
const { execSync } = require("child_process");

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
 * @param {ConfigProvider} config - The configuration
 * @param {string} comment - The comment content
 * @return {string} The comment
 */
const buildLineComment = (config, comment) => {
  return Handlebars.compile(config.lineCommentTemplate, { noEscape: true })({
    comment,
  });
};

const npmInstall = (packagePath) => {
  execSync("npm install", { cwd: packagePath });
};

module.exports = {
  maskParameters,
  buildLineComment,
  npmInstall,
};
