const ScafflaterOptions = require(".");
const FileSystemUtils = require("../fs-util");

jest.mock("../fs-util");

describe("Config Provider", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Constructor receiving configurations, should return the new configuration", () => {
    // ARRANGE
    const options = {
      source: "some-other-source",
    };

    // ACT
    const optionProvider = new ScafflaterOptions(options);

    // ASSERT
    expect(optionProvider.source).toBe("some-other-source");
  });

  test("mergeFolderConfig exception", async () => {
    // ARRANGE
    const config = new ScafflaterOptions();
    FileSystemUtils.readJSON.mockImplementation(async () => {
      throw new Error();
    });

    // ACT & ASSERT
    await expect(
      new ScafflaterOptions().getFolderOptions(null, config)
    ).rejects.toThrow();
  });

  test("Get config file for folder", async () => {
    // ARRANGE
    const options = new ScafflaterOptions();
    FileSystemUtils.pathExists.mockResolvedValue(true);
    FileSystemUtils.readJSON.mockResolvedValue({
      options: {
        lineCommentTemplate: "// {{{comment}}}",
      },
    });

    // ACT
    const newConfig = await options.getFolderOptions("some-folder-path");

    // ASSERT
    expect(FileSystemUtils.readJSON.mock.calls.length).toBe(1);
    expect(newConfig.lineCommentTemplate).toBe("// {{{comment}}}");
  });

  test("Config file for folder does not exists", async () => {
    // ARRANGE
    const config = new ScafflaterOptions();
    FileSystemUtils.pathExists.mockResolvedValue(false);
    FileSystemUtils.readJSON.mockResolvedValue({
      config: {
        lineCommentTemplate: "// {{{comment}}}",
      },
    });

    // ACT
    const newConfig = await new ScafflaterOptions().getFolderOptions(
      "some-folder-path"
    );

    // ASSERT
    expect(FileSystemUtils.readJSON.mock.calls.length).toBe(0);
    expect(newConfig).toStrictEqual(config);
  });

  test("Config file does not has config section", async () => {
    // ARRANGE
    const config = new ScafflaterOptions();
    FileSystemUtils.pathExists.mockResolvedValue(true);
    FileSystemUtils.readJSON.mockResolvedValue({
      hey: "theres no config here",
    });

    // ACT
    const newConfig = await new ScafflaterOptions().getFolderOptions(
      "some-folder-path",
      config
    );

    // ASSERT
    expect(FileSystemUtils.readJSON.mock.calls.length).toBe(1);
    expect(newConfig).toStrictEqual(config);
  });

  test("Get config from file template", async () => {
    // ARRANGE
    const config = new ScafflaterOptions();
    FileSystemUtils.readFileContent.mockResolvedValue(`
    # @scf-option {"processors":[ "a-new-processor" ]}
    # @scf-option {"lineCommentTemplate":"// {{comment}}"}
    # @scf-option {"annotate":false}
    # @scf-option {"ignore":true}
    # @scf-option {"targetName":"some-name"}
    
    the file content
    `);

    // ACT
    const newConfig = await new ScafflaterOptions().getFileOptions(
      "some/path",
      config
    );

    // ASSERT
    expect(newConfig.processors[0]).toBe("a-new-processor");
    expect(newConfig.annotate).toStrictEqual(false);
    expect(newConfig.ignore).toStrictEqual(true);
    expect(newConfig.lineCommentTemplate).toStrictEqual("// {{comment}}");
  });

  test("Remove config from file template", async () => {
    // ARRANGE
    const config = new ScafflaterOptions();
    const content = `
    # @scf-option {"processors":[ "a-new-processor" ]}
    # @scf-option {"lineCommentTemplate":"// {{comment}}"}
    # @scf-option {"annotate":false}
    # @scf-option {"ignore":true}
    # @scf-option {"targetName":"some-name"}
    
    the file content
    `;

    // ACT
    const newContent = new ScafflaterOptions().stripConfig(content, config);

    // ASSERT
    expect(newContent.includes("@scf-option")).toBe(false);
  });

  test("Get config from content with regions, should ignore region config", async () => {
    // ARRANGE
    const config = new ScafflaterOptions();
    const str = `
    # @scf-option {"processors":[ "processor1" ]}
    # @scf-region
      # @scf-option {"processors":[ "processor2" ]}
    # @end-scf-region
    
    the file content
    `;

    // ACT
    const newConfig = new ScafflaterOptions().getConfigFromString(str, config);

    // ASSERT
    expect(newConfig.processors[0]).toBe("processor1");
  });

  test("No config on file template", async () => {
    // ARRANGE
    const config = new ScafflaterOptions();
    FileSystemUtils.readFileContent.mockResolvedValue(`the file content`);

    // ACT
    const newConfig = new ScafflaterOptions().getConfigFromString(
      "some-path",
      config
    );

    // ASSERT
    expect(newConfig).toStrictEqual(config);
  });

  test("Ignore option is an array", () => {
    // ARRANGE
    const options = new ScafflaterOptions({ ignore: ["some-path-to-ignore"] });

    // ACT
    const shouldIgnore1 = options.ignores(
      "/base/path",
      "/base/path/some-path-to-ignore"
    );
    const shouldIgnore2 = options.ignores(
      "/base/path",
      "/base/path/some-path-to-ignore/some-file.txt"
    );
    const shouldNotIgnore1 = options.ignores(
      "/base/path",
      "/base/path/some-path"
    );
    const shouldNotIgnore2 = options.ignores(
      "/base/path",
      "/base/path/some-path/some-file.txt"
    );
    const shouldNotIgnore3 = options.ignores("/base/path", "/base/path");

    // ASSERT
    expect(shouldIgnore1).toBeTruthy();
    expect(shouldIgnore2).toBeTruthy();
    expect(shouldNotIgnore1).toBeFalsy();
    expect(shouldNotIgnore2).toBeFalsy();
    expect(shouldNotIgnore3).toBeFalsy();
  });

  test("Ignore option is boolean", () => {
    // ARRANGE & ACT
    const shouldIgnore = new ScafflaterOptions({ ignore: true }).ignores(
      "/base/path",
      "/base/path/some-path-to-ignore"
    );
    const shouldNotIgnore = new ScafflaterOptions({ ignore: false }).ignores(
      "/base/path",
      "/base/path/some-path"
    );

    // ASSERT
    expect(shouldIgnore).toBeTruthy();
    expect(shouldNotIgnore).toBeFalsy();
  });
});
