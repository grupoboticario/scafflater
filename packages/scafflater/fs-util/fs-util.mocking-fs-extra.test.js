/* eslint-disable no-undef */
import { jest } from "@jest/globals";
import path from "path";
import { fileURLToPath } from "url";

jest.unstable_mockModule("fs-extra", () => {
  const ret = jest.createMockFromModule("fs-extra");

  return { default: ret, ...ret };
});

jest.unstable_mockModule("os", () => {
  const ret = {
    tmpdir: jest.fn(),
    EOL: jest.requireActual("os").EOL,
  };

  return { default: ret, ...ret };
});

const fs = await import("fs-extra");
const os = await import("os");
const fsUtil = (await import("./index")).default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Testing mocking fs-extra", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("save File appending", async () => {
    // ARRANGE
    const filePath = path.join(__dirname, ".test-resources", "sample-file.txt");
    fs.pathExists.mockResolvedValue(true);

    // ACT
    await fsUtil.saveFile(filePath, "new data", true);

    // ASSERT
    expect(fs.writeFile.mock.calls[0][1]).toBe(os.EOL + os.EOL + "new data");
  });

  test("save File without append", async () => {
    // ARRANGE
    const filePath = path.join(__dirname, ".test-resources", "sample-file.txt");
    fs.exists.mockReturnValue(true);

    // ACT
    await fsUtil.saveFile(filePath, "new data", false);

    // ASSERT
    expect(fs.writeFile.mock.calls[0][1]).toBe("new data");
  });

  test("readFileContent: file exists", async () => {
    // ARRANGE
    const filePath = path.join(__dirname, ".test-resources", "sample-file.txt");
    fs.exists.mockResolvedValue(true);
    fs.readFile.mockResolvedValue("file content");

    // ACT
    const fileContent = await fsUtil.readFileContent(filePath);

    // ASSERT
    expect(fileContent).toBe("file content");
  });

  test("readFileContent: file does not exists", async () => {
    // ARRANGE
    const filePath = path.join(__dirname, ".test-resources", "sample-file.txt");
    fs.pathExists.mockResolvedValue(false);
    fs.readFile.mockResolvedValue("file content");

    // ACT
    const fileContent = await fsUtil.readFileContent(filePath);

    // ASSERT
    expect(fileContent).toBe(null);
  });

  test("readFileContent: throw error", async () => {
    // ARRANGE
    const filePath = path.join(__dirname, ".test-resources", "sample-file.txt");
    fs.pathExists.mockImplementation(() => {
      throw new Error();
    });
    fs.readFile.mockResolvedValue("file content");

    // ACT & ASSERT
    await expect(fsUtil.readFileContent(filePath)).rejects.toThrow();
  });

  test("copyEnsuringDest", async () => {
    // ACT
    await fsUtil.copyEnsuringDest("src", "dest");

    // ASSERT
    expect(fs.copy.mock.calls.length).toBe(1);
  });

  test("getTempFolder", async () => {
    // ARRANGE
    os.tmpdir.mockReturnValue("/temp/dir");

    // ACT
    await fsUtil.getTempFolder();

    // ASSERT
    expect(fs.mkdtemp.mock.calls[0][0]).toBe("/temp/dir/scf-");
  });
});
