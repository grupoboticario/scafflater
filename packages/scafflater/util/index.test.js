/* eslint-disable node/no-unpublished-require */
const { maskParameters, buildLineComment, ignores } = require("./");
const OptionsProvider = require("../options");
const mock = require("mock-fs");

describe("util", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
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

  test("Ignores", () => {
    // ARRANGE
    mock({
      "path/to/template/dir": {
        ".scafflater": "{}",
        "scf-partials": {
          ".scafflater": "{}",
          "scf-partials": {
            "README.md": "some readme",
          },
        },
      },
      "path/to/some.png": Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      "some/other/path": {
        /** another empty directory */
      },
    });
    const patterns = [".scafflater", "/scf-partials", ".git", "node_modules"];

    // ACT & ASSERT
    expect(
      ignores(
        "path/to/template/dir",
        "path/to/template/dir/.scafflater",
        patterns
      )
    ).toBeTruthy();
    expect(
      ignores(
        "path/to/template/dir",
        "path/to/template/dir/scf-partials",
        patterns
      )
    ).toBeTruthy();
    expect(
      ignores("path/to/template/dir", "path/to/template/dir/.git", patterns)
    ).toBeTruthy();
    expect(
      ignores(
        "path/to/template/dir",
        "path/to/template/dir/.git/subfolder",
        patterns
      )
    ).toBeTruthy();

    expect(
      ignores(
        "path/to/template/dir",
        "path/to/template/dir/node_modules/subfolder",
        patterns
      )
    ).toBeTruthy();

    expect(
      ignores(
        "path/to/template/dir",
        "path/to/template/dir/subfolder/node_modules",
        patterns
      )
    ).toBeTruthy();
  });
});
