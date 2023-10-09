import ScafflaterError from "./scafflater-error.js";

export default class TemplateInitializedError extends ScafflaterError {
  constructor(templateName) {
    super(`The template is already initialized: ${templateName}`);
    this.templateName = templateName;
  }
}
