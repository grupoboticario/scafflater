class TemplateInitialized extends Error {
  constructor(templateName) {
    super(`The template is already initialized: ${templateName}`);
    this.templateName = templateName;
  }
}

module.exports = TemplateInitialized;
