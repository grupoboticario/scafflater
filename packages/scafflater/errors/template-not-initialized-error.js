import ScafflaterError from "./scafflater-error";

export default class TemplateNotInitializedError extends ScafflaterError {
  constructor(templateName) {
    super(`The template is Not initialized: ${templateName}`);
    this.templateName = templateName;
  }
}
