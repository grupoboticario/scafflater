import ScafflaterError from "./scafflater-error.js";

export default class TemplateNotInitializedError extends ScafflaterError {
  constructor(templateName) {
    super(`The template is Not initialized: ${templateName}`);
    this.templateName = templateName;
  }
}
