const ScafflaterError = require("./scafflater-error");

class PartialNotFoundError extends ScafflaterError {
  constructor(templateName, partialName) {
    super(
      `The partial '${partialName}' was not found on template '${templateName}'`
    );
    this.templateName = templateName;
    this.partialName = partialName;
  }
}

module.exports = PartialNotFoundError;
