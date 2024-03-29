import ScafflaterError from "./scafflater-error.js";

export default class TemplateDefinitionNotFoundError extends ScafflaterError {
  constructor(filePath) {
    super(`.scafflater file does not have a template definition: ${filePath}`);
    this.filePath = filePath;
  }
}
