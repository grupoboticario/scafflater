const { maskParameters, buildLineComment, npmInstall } = require("./");
const ConfigProvider = require("../config-provider");
const { execSync } = require("child_process");

jest.mock("child_process");

describe("util", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("npmInstall", async () => {
    // ARRANGE

    // ACT
    await npmInstall("some/folder");

    // ASSERT
    expect(execSync).toHaveBeenCalledWith("npm install", {
      cwd: "some/folder",
    });
  });

  test("Mask Parameters", () => {
    // ARRANGE
    const templateParameters = [
      {
        name: "shouldMask",
        mask: true,
      },
      {
        name: "shouldNotMask",
        mask: false,
      },
      {
        name: "shouldNotMask2",
      },
    ];

    const parameters = {
      shouldMask: "some-password",
      shouldNotMask: 1,
      shouldNotMask2: "open text",
    };

    // ACT
    const result = maskParameters(parameters, templateParameters);

    // ASSERT
    expect(result.shouldMask).toBe("******");
    expect(result.shouldNotMask).toBe(1);
    expect(result.shouldNotMask2).toBe("open text");
  });

  test("Build Line Comment", () => {
    // ARRANGE
    const config = new ConfigProvider();
    const comment = "this is a comment";
    const otherCofig = {
      ...config,
      lineCommentTemplate: "<!-- {{{comment}}} -->",
    };

    // ACT
    const result = buildLineComment(config, comment);
    const result2 = buildLineComment(otherCofig, comment);

    // ASSERT
    expect(result).toBe("# this is a comment");
    expect(result2).toBe("<!-- this is a comment -->");
  });
});
