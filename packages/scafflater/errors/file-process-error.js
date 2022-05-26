const ScafflaterError = require("./scafflater-error");

class FileProcessError extends ScafflaterError {
  constructor(filepath, message) {
    super(`${filepath}: ${message}`);
    this.templateName = filepath;
  }
}

module.exports = FileProcessError;
