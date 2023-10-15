import { jest } from "@jest/globals";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

jest.unstable_mockModule("../util/npmInstall", () => {
  return { default: jest.fn() };
});

jest.mock("os", () => {
  const originalOs = jest.requireActual("os");
  return {
    ...originalOs,
    ...{
      tmpdir: () => {
        // If is a Github Action process, use the temp directory created for the runner
        if (process.env.GITHUB_ACTION) {
          return require("path").resolve(process.env.RUNNER_TEMP);
        }
        return originalOs.tmpdir();
      },
    },
  };
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const npmInstall = (await import("../util/npmInstall")).default;
const fs = (await import("./index")).default;

describe("fs-utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Should return the directory tree without files", () => {
    // ARRANGE
    const folderPath = join(__dirname, ".test-resources", "simple-folder");

    // ACT
    const out = fs.getDirTreeSync(folderPath, false);

    // ASSERT
    expect(out.children.length).toBe(1);
    expect(out.children[0].type).toBe("directory");
  });

  test("Should return the directory tree with files", () => {
    // ARRANGE
    const folderPath = join(__dirname, ".test-resources", "simple-folder");

    // ACT
    const out = fs.getDirTreeSync(folderPath);

    // ASSERT
    expect(out.children.length).toBe(2);
  });

  test("Should return null if directory does not exists", () => {
    // ARRANGE
    const folderPath = join(__dirname, ".test-resources-does-not-exists");

    // ACT
    const out = fs.getDirTreeSync(folderPath);

    // ASSERT
    expect(out).toBe(null);
  });

  test("Should return list of scafflater config", async () => {
    // ARRANGE
    const folderPath = join(__dirname, ".test-resources", "template-sample");

    // ACT
    const out = await fs.listFilesDeeply(folderPath, "/**/.scafflater");

    // ASSERT
    expect(out.length).toBe(2);
  });

  test("No files found, Should return null", async () => {
    // ARRANGE
    const folderPath = join(__dirname, ".test-resources", "template-sample");

    // ACT
    const out = await fs.listFilesDeeply(folderPath, "__...........__");

    // ASSERT
    expect(out).toBe(null);
  });

  test("Read JSON with comments", async () => {
    // ARRANGE
    const folderPath = join(
      __dirname,
      ".test-resources",
      "template-sample",
      ".scafflater",
    );
    const noExistingFolderPath = join(
      __dirname,
      ".test-resources",
      "template-sample",
      ".scafflater2",
    );
    const invalidFolderPath = join(
      __dirname,
      ".test-resources",
      "sample-file.txt",
    );

    // ACT
    const out = await fs.readJSON(folderPath);
    const out2 = await fs.readJSON(noExistingFolderPath);

    // ASSERT
    expect(out).toStrictEqual({
      name: "main-name",
      version: "main-version",
    });
    expect(out2).toBeNull();
    await expect(fs.readJSON(invalidFolderPath)).rejects.toThrow();
  });

  test("findFileUp", async () => {
    // ARRANGE
    const filePath = resolve(
      __dirname,
      ".test-resources",
      "template-sample",
      "hooks",
      "onHook.js",
    );

    // ACT
    const result = await fs.findFileUp(filePath, "sample-file.txt");

    // ASSERT
    expect(result).toBe(
      resolve(__dirname, ".test-resources", "sample-file.txt"),
    );
    await expect(
      fs.findFileUp(filePath, "does-not-exists-file.txt"),
    ).rejects.toThrow(/File not found/);
  });

  test("listJsScripts", async () => {
    // ARRANGE
    const filePath = resolve(
      __dirname,
      ".test-resources",
      "template-sample",
      "hooks",
    );
    const filePathDoesNotExists = resolve(
      __dirname,
      ".test-resources",
      "template-sample",
      "_does-not-exists",
    );
    const filePathEmptyFolder = resolve(
      __dirname,
      ".test-resources",
      "template-sample",
      "_empty_folder",
    );

    // ACT
    const result = await fs.listJsScripts(filePath, true);
    const resultDoesNotExists = await fs.listJsScripts(filePathDoesNotExists);
    const resultEmptyFolder = await fs.listJsScripts(filePathEmptyFolder);

    // ASSERT
    expect(result.length).toBe(3);
    expect(resultDoesNotExists.length).toBe(0);
    expect(resultEmptyFolder.length).toBe(0);
    expect(npmInstall).toHaveBeenCalled();
  });

  test("loadScriptsAsObjects", async () => {
    // ARRANGE
    const filePath = join(
      __dirname,
      ".test-resources",
      "template-sample",
      "hooks",
    );

    // ACT
    const result = await fs.loadScriptsAsObjects(filePath, false);

    // ASSERT
    expect(result.onEnd !== undefined).toBe(true);
    expect(result.onStart !== undefined).toBe(true);
  });
});
