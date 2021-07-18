const mock = {
  storeTemplate: jest.fn(),
  getTemplatePath: jest.fn(),
};

module.exports = class TemplateCache {
  constructor() {
    return mock;
  }

  static getTemplateCache() {
    return mock;
  }
};
