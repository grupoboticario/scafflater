const InitCommand = require("./init");
const scafflater = require("@scafflater/scafflater");

jest.mock("@scafflater/scafflater");

const templateManager = new scafflater.TemplateManager();
const mockedScafflater = {
  templateManager,
  init: jest.fn(),
};

const mockedConfig = {
  isInitialized: jest.fn(),
};

describe("InitCommand", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();

    jest
      .spyOn(scafflater.TemplateSource, "resolveTemplateSourceFromSourceKey")
      .mockReturnValue(new scafflater.LocalFolderTemplateSource({}));

    jest.spyOn(scafflater, "Scafflater").mockImplementation(() => {
      return mockedScafflater;
    });

    jest.spyOn(scafflater.Config, "fromLocalPath").mockResolvedValue({
      config: mockedConfig,
    });

    jest
      .spyOn(templateManager, "getTemplateFromSource")
      .mockResolvedValue(
        new (jest.requireActual("@scafflater/scafflater").LocalTemplate)(
          "/some/path",
          "/some/path/.scafflater/scafflater.jsonc",
          "some-new-template"
        )
      );
  });

  test("Template is already initialized, should abort", async () => {
    // ARRANGE
    mockedConfig.isInitialized.mockImplementation(() => {
      return true;
    });

    const initCommand = new InitCommand(["https://github.com/some/repo"], {});

    // ACT
    await initCommand.run();

    // ASSERT
    expect(scafflater.logger.info).toHaveBeenCalledWith(
      "The template is already initialized!"
    );
  });

  test("Template is not initialized, should initialize it", async () => {
    const initCommand = new InitCommand(["https://github.com/some/repo"], {});

    // ACT
    await initCommand.run();

    // ASSERT
    expect(mockedScafflater.init).toHaveBeenCalledWith(
      "https://github.com/some/repo",
      {},
      "last",
      "./"
    );
    expect(scafflater.logger.log).toHaveBeenCalledWith(
      "notice",
      "Template initialized. Fell free to run partials. 🥳"
    );
  });

  test("Template source not set, should log error", async () => {
    const initCommand = new InitCommand([], {});

    // ACT
    await initCommand.run();

    // ASSERT
    expect(scafflater.logger.error).toHaveBeenCalledWith(
      "The parameter 'source' is required."
    );
  });

  test("ScafflaterError is thrown, should info it", async () => {
    jest
      .spyOn(scafflater.TemplateSource, "resolveTemplateSourceFromSourceKey")
      .mockImplementation(() => {
        throw new scafflater.ScafflaterError();
      });

    const initCommand = new InitCommand(["asdasdasdasdasdasd"], {});

    // ACT
    await initCommand.run();

    // ASSERT
    expect(scafflater.logger.info).toHaveBeenCalled();
    expect(scafflater.logger.error).not.toHaveBeenCalled();
  });
});
