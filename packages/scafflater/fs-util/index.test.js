/* eslint-disable no-undef */
const fsUtils = require("./");
const path = require("path");
const npmInstall = require("../util/npmInstall");
jest.mock("../util/npmInstall");

describe("fs-utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Should return the directory tree without files", () => {
    // ARRANGE
    const folderPath = path.join(__dirname, ".test-resources", "simple-folder");

    // ACT
    const out = fsUtils.getDirTreeSync(folderPath, false);

    // ASSERT
    expect(out.children.length).toBe(1);
    expect(out.children[0].type).toBe("directory");
  });

  test("Should return the directory tree with files", () => {
    // ARRANGE
    const folderPath = path.join(__dirname, ".test-resources", "simple-folder");

    // ACT
    const out = fsUtils.getDirTreeSync(folderPath);

    // ASSERT
    expect(out.children.length).toBe(2);
  });

  test("Should return null if directory does not exists", () => {
    // ARRANGE
    const folderPath = path.join(__dirname, ".test-resources-does-not-exists");

    // ACT
    const out = fsUtils.getDirTreeSync(folderPath);

    // ASSERT
    expect(out).toBe(null);
  });

  test("Should return list of scafflater config", async () => {
    // ARRANGE
    const folderPath = path.join(
      __dirname,
      ".test-resources",
      "template-sample"
    );

    // ACT
    const out = await fsUtils.listFilesDeeply(folderPath, "/**/.scafflater");

    // ASSERT
    expect(out.length).toBe(2);
  });

  test("No files found, Should return null", async () => {
    // ARRANGE
    const folderPath = path.join(
      __dirname,
      ".test-resources",
      "template-sample"
    );

    // ACT
    const out = await fsUtils.listFilesDeeply(folderPath, "__...........__");

    // ASSERT
    expect(out).toBe(null);
  });

  test("Read JSON with comments", async () => {
    // ARRANGE
    const folderPath = path.join(
      __dirname,
      ".test-resources",
      "template-sample",
      ".scafflater"
    );
    const noExistingFolderPath = path.join(
      __dirname,
      ".test-resources",
      "template-sample",
      ".scafflater2"
    );
    const invalidFolderPath = path.join(
      __dirname,
      ".test-resources",
      "sample-file.txt"
    );

    // ACT
    const out = await fsUtils.readJSON(folderPath);
    const out2 = await fsUtils.readJSON(noExistingFolderPath);

    // ASSERT
    expect(out).toStrictEqual({
      name: "main-name",
      version: "main-version",
    });
    expect(out2).toBeNull();
    await expect(fsUtils.readJSON(invalidFolderPath)).rejects.toThrow();
  });

  test("Require", () => {
    // ARRANGE
    const jsPath = path.join(__dirname, ".test-resources", "fake-module.js");

    // ACT
    const fakeModule = fsUtils.require(jsPath);

    expect(fakeModule).toBe("Fake Module");
  });

  test("findFileUp", async () => {
    // ARRANGE
    const filePath = path.resolve(
      __dirname,
      ".test-resources",
      "template-sample",
      "hooks",
      "onHook.js"
    );

    // ACT
    const result = await fsUtils.findFileUp(filePath, "sample-file.txt");

    // ASSERT
    expect(result).toBe(
      path.resolve(__dirname, ".test-resources", "sample-file.txt")
    );
    await expect(
      fsUtils.findFileUp(filePath, "does-not-exists-file.txt")
    ).rejects.toThrow(/File not found/);
  });

  test("listJsScripts", async () => {
    // ARRANGE
    const filePath = path.resolve(
      __dirname,
      ".test-resources",
      "template-sample",
      "hooks"
    );
    const filePathDoesNotExists = path.resolve(
      __dirname,
      ".test-resources",
      "template-sample",
      "_does-not-exists"
    );
    const filePathEmptyFolder = path.resolve(
      __dirname,
      ".test-resources",
      "template-sample",
      "_empty_folder"
    );

    // ACT
    const result = await fsUtils.listJsScripts(filePath, true);
    const resultDoesNotExists = await fsUtils.listJsScripts(
      filePathDoesNotExists
    );
    const resultEmptyFolder = await fsUtils.listJsScripts(filePathEmptyFolder);

    // ASSERT
    expect(result.length).toBe(2);
    expect(resultDoesNotExists.length).toBe(0);
    expect(resultEmptyFolder.length).toBe(0);
    expect(npmInstall).toHaveBeenCalled();
  });

  test("loadScriptsAsObjects", async () => {
    // ARRANGE
    const filePath = path.join(
      __dirname,
      ".test-resources",
      "template-sample",
      "hooks"
    );

    // ACT
    const result = await fsUtils.loadScriptsAsObjects(filePath, false);

    // ASSERT
    expect(result.onEnd !== undefined).toBe(true);
    expect(result.onStart !== undefined).toBe(true);
    // expect(true).toBe(true)
  });
});
