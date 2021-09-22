const ScafflaterError = require("./scafflater-error");

class ScafflaterFileNotFoundError extends ScafflaterError {
  constructor(filePath) {
    super(`Scafflater file not found: ${filePath}`);
    this.filePath = filePath;
    this.name = "ScafflaterFileNotFoundError";
  }
}

module.exports = ScafflaterFileNotFoundError;
