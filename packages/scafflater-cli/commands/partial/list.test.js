import { jest } from "@jest/globals";
import {
  LocalPartial,
  LocalTemplate,
} from "../../../scafflater/scafflater-config";

jest.unstable_mockModule("@scafflater/scafflater", () => {
  return {
    Scafflater: jest.fn(),
    TemplateManager: class {
      getTemplate = jest.fn();
    },
    logger: {
      info: jest.fn(),
      print: jest.fn(),
      error: jest.fn(),
    },
    Config: {
      fromLocalPath: jest.fn(),
    },
    ScafflaterOptions: jest.fn(),
  };
});

const { Scafflater, TemplateManager, logger, Config } = await import(
  "@scafflater/scafflater"
);
const ListCommand = (await import("./list")).default;

describe("ListCommand", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const templateManager = new TemplateManager();
  const mockedScafflater = {
    getTemplateManager: jest.fn().mockResolvedValue(templateManager),
    init: jest.fn(),
  };
  Scafflater.mockImplementation(() => {
    return mockedScafflater;
  });

  test("Folder does not have a initialized template, should info.", async () => {
    // ARRANGE
    jest.spyOn(Config, "fromLocalPath").mockResolvedValue(null);
    const listCommand = new ListCommand([], {});

    // ACT
    await listCommand.run();

    // ASSERT
    expect(logger.info).toHaveBeenCalledWith("No initialized template found!");
  });

  test("Folder has initialized templates and those have partials, should print the partials.", async () => {
    // ARRANGE
    jest.spyOn(Config, "fromLocalPath").mockResolvedValue({
      config: {
        templates: [
          {
            name: "some-template",
            source: {
              name: "some-source",
              key: "http://some-template/url",
            },
          },
        ],
      },
    });
    templateManager.getTemplate.mockResolvedValue(
      new LocalTemplate(
        "/some/template/path",
        "/some/template/path/.scafflater/scafflater.jsonc",
        "some-template",
        "The template",
        "0.0.1",
        [
          new LocalPartial(
            "/some/partial/path",
            "the-partial",
            "This is an partial",
          ),
          new LocalPartial("/some/partial/path", "the-partial"),
        ],
      ),
    );
    const listCommand = new ListCommand([], {});

    // ACT
    await listCommand.run();

    // ASSERT
    expect(logger.print).toHaveBeenCalledWith(
      expect.stringMatching(/.*the-partial.*This is an partial.*/gm),
    );
  });

  test("Folder has initialized templates but the templates does not have partials, should info.", async () => {
    // ARRANGE
    jest.spyOn(Config, "fromLocalPath").mockResolvedValue({
      config: {
        templates: [
          {
            name: "some-template",
            source: {
              name: "some-source",
              key: "http://some-template/url",
            },
          },
        ],
      },
    });
    templateManager.getTemplate.mockResolvedValue(
      new LocalTemplate(
        "/some/template/path",
        "some-template",
        "The template",
        "0.0.1",
        [],
      ),
    );
    const listCommand = new ListCommand([], {});

    // ACT
    await listCommand.run();

    // ASSERT
    expect(logger.print).toHaveBeenCalledWith(
      expect.stringMatching(/No partials available/),
    );
  });
});
