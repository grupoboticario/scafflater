import { jest } from "@jest/globals";

jest.unstable_mockModule("../../fs-util", () => {
  const ret = {
    pathExists: jest.fn(),
    listFilesByExtensionDeeply: jest.fn(),
    require: jest.fn(),
  };

  return {
    ...ret,
    default: ret,
  };
});

jest.unstable_mockModule("handlebars", () => {
  const ret = jest.createMockFromModule("handlebars");

  return {
    ...ret,
    default: ret,
  };
});

const fsUtil = await import("../../fs-util");
const HandlebarsProcessor = (await import("./handlebars-processor")).default;
const Handlebars = (await import("handlebars")).default;

describe("HandlebarsProcessor", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("Folder is null or does not exists, should not call registerHelper", async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(false);

    // ACT
    await HandlebarsProcessor.loadHelpersFolder(null);
    await HandlebarsProcessor.loadHelpersFolder("this/path/does/not/exists");

    // ASSERT
    expect(Handlebars.registerHelper).toHaveBeenCalledTimes(0);
  });

  test("Register helpers", async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(true);
    fsUtil.listFilesByExtensionDeeply.mockResolvedValue([
      "helper1.js",
      "helper2.js",
    ]);
    fsUtil.require.mockReturnValueOnce("function1");
    fsUtil.require.mockReturnValueOnce("function2");

    // ACT
    await HandlebarsProcessor.loadHelpersFolder("this/path/exists");

    // ASSERT
    expect(Handlebars.registerHelper).toHaveBeenCalledTimes(2);
    expect(Handlebars.registerHelper).toHaveBeenCalledWith(
      "helper1",
      "function1",
    );
    expect(Handlebars.registerHelper).toHaveBeenCalledWith(
      "helper2",
      "function2",
    );
  });
});
