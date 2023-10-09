import ScafflaterError from "./scafflater-error.js";

export default class ScafflaterFileNotFoundError extends ScafflaterError {
  constructor(filePath) {
    super(`Scafflater file not found: ${filePath}`);
    this.filePath = filePath;
    this.name = "ScafflaterFileNotFoundError";
  }
}
