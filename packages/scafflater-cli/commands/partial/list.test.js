jest.mock("scafflater/fs-util");
jest.mock("scafflater/logger");
jest.mock("scafflater/template-manager");
jest.mock("scafflater");

const ListCommand = require("./list");
const fsUtil = require("scafflater/fs-util");
const logger = require("scafflater/logger");
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
    new Scafflater().templateManager.templateCache.getTemplatePath.mockResolvedValueOnce(
      "some/path"
    );
    new Scafflater().templateManager.listPartials.mockResolvedValueOnce([]);
    const listCommand = new ListCommand([], {});

    // ACT
    await listCommand.run();

    // ASSERT
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringMatching(/No partials available on template/)
    );
  });

  test("Template is available and has partials, should print it", async () => {
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
    const listCommand = new ListCommand([], {});
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
    expect(logger.print).toHaveBeenCalledWith(
      expect.stringMatching(/PARTIALS/)
    );
    expect(logger.print).toHaveBeenCalledWith(
      expect.stringMatching(/ {2}partial-name\tPartial Description/)
    );
    expect(logger.print).toHaveBeenCalledWith(
      expect.stringMatching(/ {2}partial2-name\t/)
    );
  });
});
