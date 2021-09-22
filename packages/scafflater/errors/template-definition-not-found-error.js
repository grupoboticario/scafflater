const ScafflaterError = require("./scafflater-error");

class TemplateDefinitionNotFoundError extends ScafflaterError {
  constructor(filePath) {
    super(`.scafflater file does not have a template definition: ${filePath}`);
    this.filePath = filePath;
  }
}

module.exports = TemplateDefinitionNotFoundError;
