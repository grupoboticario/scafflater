const mock = {
  templateSource: {
    getTemplate: jest.fn(),
  },
  getPartial: jest.fn(),
  getTemplatePath: jest.fn(),
  getTemplateInfo: jest.fn(),
  getTemplateFromSource: jest.fn(),
};

module.exports = class TemplateManager {
  constructor() {
    return mock;
  }
};
