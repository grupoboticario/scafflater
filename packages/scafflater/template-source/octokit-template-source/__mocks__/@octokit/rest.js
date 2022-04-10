const mockOctokit = {
  request: jest.fn(),
};

module.exports = {
  Octokit: class {
    constructor() {
      return mockOctokit;
    }
  },
};
