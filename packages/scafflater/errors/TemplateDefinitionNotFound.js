class TemplateDefinitionNotFound extends Error {
  constructor(filePath) {
    super(`.scafflater file does not have a template definition: ${filePath}`);
    this.filePath = filePath;
  }
}

module.exports = TemplateDefinitionNotFound;
