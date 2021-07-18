/* eslint-disable no-undef */
const {
  parseParametersFlags,
  promptMissingParameters,
  listPartials,
} = require(".");
const inquirer = require("inquirer");
const fsUtil = require("scafflater/fs-util");
const logger = require("scafflater/logger");
const TemplateManager = require("scafflater/template-manager");

jest.mock("inquirer");
jest.mock("scafflater/fs-util");
jest.mock("scafflater/logger");
jest.mock("scafflater/template-manager");
jest.mock("scafflater");

test("Parse Parameters Flags", () => {
  // ARRANGE
  const parameters = ["name1:value1", "name2:value2"];

  // ACT
  const result = parseParametersFlags(parameters);

  // ASSERT
  expect(result.name1).toBe("value1");
  expect(result.name2).toBe("value2");
});

test("Prompt missing parameters", async () => {
  // ARRANGE
  const parameterFlags = ["name1:value1"];
  const templateParameters = [
    {
      type: "input",
      name: "name2",
      message: "What`s the system/project/product?",
    },
  ];
  inquirer.prompt.mockReturnValue({ name2: "value2" });

  // ACT
  const result = await promptMissingParameters(
    parameterFlags,
    templateParameters
  );

  // ASSERT
  expect(inquirer.prompt.mock.calls[0][0]).toStrictEqual(templateParameters);
  expect(result.name1).toBe("value1");
  expect(result.name2).toBe("value2");
});

describe("listPartials", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  const mockedConfig = {
    scfFileName: ".scafflater",
  };

  test("Template is not initialized, should log error", async () => {
    // ARRANGE
    fsUtil.pathExistsSync.mockReturnValue(false);

    // ACT
    await listPartials(new TemplateManager({}), mockedConfig, "./");

    // ASSERT
    expect(logger.error).toHaveBeenCalledWith(
      "The template is not initialized!"
    );
  });

  test("Template could not be located, should log error", async () => {
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
    new TemplateManager({}).templateCache.getTemplatePath.mockResolvedValue(
      null
    );

    // ACT
    await listPartials(new TemplateManager({}), mockedConfig, "./");

    // ASSERT
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringMatching(/Cannot get template/)
    );
  });

  test("Template is not cached, should get it from source", async () => {
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
    new TemplateManager({}).templateCache.getTemplatePath.mockResolvedValueOnce(
      null
    );
    new TemplateManager({}).templateCache.getTemplatePath.mockResolvedValueOnce(
      "some/path"
    );

    // ACT
    await listPartials(new TemplateManager({}), mockedConfig, "./");

    // ASSERT
    expect(new TemplateManager({}).getTemplateFromSource).toHaveBeenCalled();
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
    new TemplateManager({}).templateCache.getTemplatePath.mockResolvedValueOnce(
      "some/path"
    );
    new TemplateManager({}).listPartials.mockResolvedValueOnce([]);

    // ACT
    await listPartials(new TemplateManager({}), mockedConfig, "./");

    // ASSERT
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringMatching(/No partials available on template/)
    );
  });

  test("Template is available and has partials, should return partials", async () => {
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
    new TemplateManager({}).templateCache.getTemplatePath.mockResolvedValueOnce(
      "some/path"
    );
    new TemplateManager({}).listPartials.mockResolvedValueOnce([
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
    const partials = await listPartials(
      new TemplateManager({}),
      mockedConfig,
      "./"
    );

    // ASSERT
    expect(partials.length).toBe(2);
  });
});
