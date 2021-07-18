jest.mock("scafflater/fs-util");
jest.mock("scafflater/logger");
jest.mock("scafflater/template-manager");
jest.mock("scafflater");
jest.mock("inquirer");

const RunCommand = require("./run");
const fsUtil = require("scafflater/fs-util");
const logger = require("scafflater/logger");
const inquirer = require("inquirer");
const Scafflater = require("scafflater");

describe("ListCommand", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test("Template does not have partials, should error it", async () => {
    // ARRANGE
    fsUtil.pathExistsSync.mockReturnValue(true);
    fsUtil.readJSON.mockResolvedValue({
      template: {
        name: "some-template",
        version: "some-version",
        source: {
          key: "some-gh-repo",
        },
      },
    });
    new Scafflater().templateManager.getTemplateFromSource.mockResolvedValue({
      parameters: [],
    });
    new Scafflater().templateManager.templateCache.getTemplatePath.mockResolvedValueOnce(
      "some/path"
    );
    new Scafflater().templateManager.listPartials.mockResolvedValueOnce([]);
    const runCommand = new RunCommand([], {});

    // ACT
    await runCommand.run();

    // ASSERT
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringMatching(/No partials available on template/)
    );
  });

  test("Template is available, has partials, the partial was informed by parameter but is invalid, should log error", async () => {
    // ARRANGE
    fsUtil.pathExistsSync.mockReturnValue(true);
    fsUtil.readJSON.mockResolvedValue({
      template: {
        name: "some-template",
        version: "some-version",
        source: {
          key: "some-gh-repo",
        },
      },
    });
    const listCommand = new RunCommand(["some-invalid-partial"], {});
    new Scafflater().templateManager.templateCache.getTemplatePath.mockResolvedValueOnce(
      "some/path"
    );
    new Scafflater().templateManager.listPartials.mockResolvedValueOnce([
      {
        config: {
          type: "partial",
          name: "partial-name",
          description: "Partial Description",
        },
      },
      {
        config: {
          type: "partial2",
          name: "partial2-name",
        },
      },
    ]);

    // ACT
    await listCommand.run();

    // ASSERT
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringMatching(/The partial '.*' is not available at template/)
    );
  });

  test("Template is available, has partials, the partial was informed by parameter and is invalid, should execute", async () => {
    // ARRANGE
    fsUtil.pathExistsSync.mockReturnValue(true);
    fsUtil.readJSON.mockResolvedValue({
      template: {
        name: "some-template",
        version: "some-version",
        source: {
          key: "some-gh-repo",
        },
      },
    });
    const listCommand = new RunCommand(["partial-name"], {});
    new Scafflater().templateManager.templateCache.getTemplatePath.mockResolvedValueOnce(
      "some/path"
    );
    new Scafflater().templateManager.listPartials.mockResolvedValueOnce([
      {
        config: {
          type: "partial",
          name: "partial-name",
          description: "Partial Description",
        },
      },
      {
        config: {
          type: "partial2",
          name: "partial2-name",
        },
      },
    ]);

    // ACT
    await listCommand.run();

    // ASSERT
    expect(new Scafflater().runPartial).toHaveBeenCalledWith(
      "partial-name",
      {},
      "./"
    );
  });

  test("Template is available, has partials, the partial was not informed by parameter, should prompt and execute", async () => {
    // ARRANGE
    fsUtil.pathExistsSync.mockReturnValue(true);
    fsUtil.readJSON.mockResolvedValue({
      template: {
        name: "some-template",
        version: "some-version",
        source: {
          key: "some-gh-repo",
        },
      },
    });
    const listCommand = new RunCommand([], {});
    new Scafflater().templateManager.templateCache.getTemplatePath.mockResolvedValueOnce(
      "some/path"
    );
    new Scafflater().templateManager.listPartials.mockResolvedValueOnce([
      {
        config: {
          type: "partial",
          name: "partial-name",
          description: "Partial Description",
        },
      },
      {
        config: {
          type: "partial2",
          name: "partial2-name",
        },
      },
    ]);
    inquirer.prompt.mockResolvedValue({ partialName: "partial-name" });

    // ACT
    await listCommand.run();

    // ASSERT
    expect(new Scafflater().runPartial).toHaveBeenCalledWith(
      "partial-name",
      {},
      "./"
    );
  });
});
