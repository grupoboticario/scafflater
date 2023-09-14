import ScafflaterError from "./scafflater-error";

export default class FileProcessError extends ScafflaterError {
  constructor(filepath, message) {
    super(`${filepath}: ${message}`);
    this.templateName = filepath;
  }
}
