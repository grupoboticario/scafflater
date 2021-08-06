const InitCommand = require("./init");
const logger = require("scafflater/logger");
const { Scafflater, TemplateManager } = require("scafflater");
const Config = require("scafflater/scafflater-config/config");
const {
  LocalTemplate,
} = require("scafflater/scafflater-config/local-template");

jest.mock("scafflater");
jest.mock("scafflater/logger");

describe("InitCommand", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const templateManager = new TemplateManager();
  const mockedScafflater = {
    templateManager: templateManager,
    init: jest.fn(),
  };
  Scafflater.mockImplementation(() => {
    return mockedScafflater;
  });

  test("Template is already initialized, should abort", async () => {
    // ARRANGE
    jest
      .spyOn(templateManager, "getTemplateFromSource")
      .mockResolvedValue(
        new LocalTemplate(
          "/some/path",
          "/some/path/.scafflater/scafflater.jsonc",
          "some-template"
        )
      );
    jest.spyOn(Config, "fromLocalPath").mockResolvedValue({
      config: {
        templates: [
          {
            name: "some-template",
          },
        ],
      },
    });
    const initCommand = new InitCommand(["https://github.com/some/repo"], {});

    // ACT
    await initCommand.run();

    // ASSERT
    expect(logger.info).toHaveBeenCalledWith(
      "The template is already initialized!"
    );
  });

  test("Template is not initialized, should initialize it", async () => {
    jest
      .spyOn(templateManager, "getTemplateFromSource")
      .mockResolvedValue(
        new LocalTemplate(
          "/some/path",
          "/some/path/.scafflater/scafflater.jsonc",
          "some-new-template"
        )
      );
    jest.spyOn(Config, "fromLocalPath").mockResolvedValue({
      config: new Config(),
    });
    const initCommand = new InitCommand(["https://github.com/some/repo"], {});

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
