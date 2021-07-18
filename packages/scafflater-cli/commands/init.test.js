jest.mock("scafflater/fs-util");
jest.mock("scafflater/logger");
jest.mock("scafflater/template-manager");
jest.mock("scafflater");

const InitCommand = require("./init");
const fsUtil = require("scafflater/fs-util");
const logger = require("scafflater/logger");
const Scafflater = require("scafflater");

describe("InitCommand", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test("Template is already initialized, should abort", async () => {
    // ARRANGE
    fsUtil.pathExistsSync.mockReturnValue(true);
    const initCommand = new InitCommand([], {});

    // ACT
    await initCommand.run();

    // ASSERT
    expect(logger.info).toHaveBeenCalledWith(
      "The output folder is initialized!"
    );
  });

  test("Template is not initialized, should initialize it", async () => {
    // ARRANGE
    fsUtil.pathExistsSync.mockReturnValue(false);
    const initCommand = new InitCommand(["https://github.com/some/repo"], {});
    new Scafflater().templateManager.getTemplateFromSource.mockResolvedValue({
      parameters: [],
    });

    // ACT
    await initCommand.run();

    // ASSERT
    expect(new Scafflater().init).toHaveBeenCalledWith(
      "https://github.com/some/repo",
      {},
      "./"
    );
    expect(logger.log).toHaveBeenCalledWith(
      "notice",
      "Template initialized. Fell free to run partials. 🥳"
    );
  });
});
