const ScafflaterError = require("./scafflater-error");

class TemplateNotInitializedError extends ScafflaterError {
  constructor(templateName) {
    super(`The template is Not initialized: ${templateName}`);
    this.templateName = templateName;
  }
}

module.exports = TemplateNotInitializedError;
