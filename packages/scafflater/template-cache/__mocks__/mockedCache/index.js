const TemplateCache = require("..");

const mock = {
  storeTemplate: jest.fn(),
  getTemplatePath: jest.fn(),
  listCachedTemplates: jest.fn(),
};

module.exports = class MockedCache extends TemplateCache {
  constructor() {
    return mock;
  }
};
