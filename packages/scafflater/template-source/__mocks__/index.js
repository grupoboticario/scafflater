const mock = {
  getTemplate: jest.fn()
}

module.exports = class TemplateSource {
  constructor() {
    return mock
  }

  static getTemplateSource() {
    return mock
  }
}