const { maskParameters, buildLineComment } = require("./");
const OptionsProvider = require("../options-provider");

describe("util", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const config = new OptionsProvider();
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
