/* eslint-disable no-undef */
const { parseParametersFlags, promptMissingParameters } = require(".");
const inquirer = require("inquirer");
const {
  PersistedParameter,
} = require("@scafflater/scafflater/scafflater-config/persisted-parameter");

jest.mock("inquirer");
jest.mock("@scafflater/scafflater/fs-util");
jest.mock("@scafflater/scafflater/logger");
jest.mock("@scafflater/scafflater/template-manager");
jest.mock("@scafflater/scafflater/template-cache");
jest.mock("@scafflater/scafflater");

test("Parse Parameters Flags", () => {
  // ARRANGE
  const parameters = ["name1:value1", "name2:value2"];

  // ACT
  const result = parseParametersFlags(parameters);

  // ASSERT
  expect(result.name1).toBe("value1");
  expect(result.name2).toBe("value2");
});

describe("promptMissingParameters", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  test("Prompt missing parameters", async () => {
    // ARRANGE
    const parameterFlags = ["name1:value1"];
    const templateParameters = [
      {
        type: "input",
        name: "name1",
        message: "What`s the system/project/product?",
      },
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
    expect(inquirer.prompt.mock.calls[0][0]).toStrictEqual([
      {
        type: "input",
        name: "name2",
        message: "What`s the system/project/product?",
      },
    ]);
    expect(result.name1).toBe("value1");
    expect(result.name2).toBe("value2");
  });

  test("Prompt missing parameters with persistent parameter", async () => {
    // ARRANGE
    const parameterFlags = ["name1:value1"];
    const globalParameters = [new PersistedParameter("name3", "the name")];
    const persistedTemplateParameters = [new PersistedParameter("name4", 123)];
    const templateParameters = [
      {
        type: "input",
        name: "name1",
        message: "What`s the system/project/product?",
      },
      {
        type: "input",
        name: "name2",
        message: "What`s the system/project/product?",
      },
      {
        type: "input",
        name: "name3",
        message: "What`s your name?",
      },
      {
        type: "input",
        name: "name4",
        message: "What`s your age?",
      },
    ];
    inquirer.prompt.mockReturnValue({ name2: "value2" });

    // ACT
    const result = await promptMissingParameters(
      parameterFlags,
      templateParameters,
      globalParameters,
      persistedTemplateParameters
    );

    // ASSERT
    expect(inquirer.prompt.mock.calls[0][0]).toStrictEqual([
      {
        type: "input",
        name: "name2",
        message: "What`s the system/project/product?",
      },
    ]);
    expect(result.name1).toBe("value1");
    expect(result.name2).toBe("value2");
    expect(result.name3).toBe("the name");
    expect(result.name4).toBe(123);
  });
});
