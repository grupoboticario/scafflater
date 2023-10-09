import ScafflaterError from "./scafflater-error.js";

export default class FileProcessError extends ScafflaterError {
  constructor(filepath, message) {
    super(`${filepath}: ${message}`);
    this.templateName = filepath;
  }
}
