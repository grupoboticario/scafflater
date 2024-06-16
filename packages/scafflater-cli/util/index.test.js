import { jest } from "@jest/globals";
import { PersistedParameter } from "../../scafflater/scafflater-config";

jest.unstable_mockModule("inquirer", () => {
  return {
    default: {
      prompt: jest.fn(),
    },
  };
});

jest.unstable_mockModule("@scafflater/scafflater", () => {
  return {
    Scafflater: jest.fn(),
    PersistedParameter,
    ParameterConfig: jest.fn(),
  };
});

const { parseParametersFlags, promptMissingParameters, parseParametersNames } =
  await import("./index");

const { prompt } = (await import("inquirer")).default;

test("Parse Parameters Flags", () => {
  // ARRANGE
  const parameters = [
    "name1:value1",
    "name2:value2",
    "github.repoUrl:https://github.com/grupoboticario/alquimia-template-flutter-lib",
    "github.repo.other.url:https://other.url.com",
    "arr[]:arr_value1",
    "arr[]:arr_value2",
    "otherArr[0]:other_value1",
    "otherArr[1]:other_value2",
  ];

  // ACT
  const result = parseParametersFlags(parameters);

  // ASSERT
  expect(result.name1).toBe("value1");
  expect(result.name2).toBe("value2");
  expect(result.github.repoUrl).toBe(
    "https://github.com/grupoboticario/alquimia-template-flutter-lib",
  );
  expect(result.github.repo.other.url).toBe("https://other.url.com");
  expect(result["arr[0]"]).toBe("arr_value1");
  expect(result["arr[1]"]).toBe("arr_value2");
  expect(result["otherArr[0]"]).toBe("other_value1");
  expect(result["otherArr[1]"]).toBe("other_value2");
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
    prompt.mockReturnValue({ name2: "value2" });

    // ACT
    const result = await promptMissingParameters(
      parameterFlags,
      templateParameters,
    );

    // ASSERT
    expect(prompt.mock.calls[0][0]).toStrictEqual([
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
    prompt.mockReturnValue({ name2: "value2" });

    // ACT
    const result = await promptMissingParameters(
      parameterFlags,
      templateParameters,
      globalParameters,
      persistedTemplateParameters,
    );

    // ASSERT
    expect(prompt.mock.calls[0][0]).toStrictEqual([
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

describe("parseParametersNames", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  test("Parse parameters", async () => {
    // ARRANGE
    const input = {
      param1: "some-value",
      "param2.name": "param-name",
      "param2.description": "Parameter Description",
      "param3[0]": "Position 0",
      "param3[1]": "Position 1",
      "param4[0].name": "name4.0",
      "param4[0].description": "Description 4.0",
      "param4[1].name": "name4.1",
      "param4[1].description": "Description 4.1",
    };

    // ACT
    const result = parseParametersNames(input);

    // ASSERT
    expect(result).toMatchObject({
      param1: "some-value",
      param2: {
        name: "param-name",
        description: "Parameter Description",
      },
      param3: ["Position 0", "Position 1"],
      param4: [
        {
          name: "name4.0",
          description: "Description 4.0",
        },
        {
          name: "name4.1",
          description: "Description 4.1",
        },
      ],
    });
  });
});
