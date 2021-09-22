const ScafflaterError = require("./scafflater-error");

class TemplateInitializedError extends ScafflaterError {
  constructor(templateName) {
    super(`The template is already initialized: ${templateName}`);
    this.templateName = templateName;
  }
}

module.exports = TemplateInitializedError;
