/* eslint-disable no-undef */
const fsUtil = require("../fs-util");
const path = require("path");
const fs = require("fs-extra");
const os = require("os");
const { EOL } = require("os");

jest.mock("fs-extra");
jest.mock("os");

describe("Testing mocking fs-extra", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("save File appending", async () => {
    // ARRANGE
    const filePath = path.join(__dirname, ".test-resources", "sample-file.txt");
    fs.exists.mockReturnValue(true);

    // ACT
    await fsUtil.saveFile(filePath, "new data", true);

    // ASSERT
    expect(fs.writeFile.mock.calls[0][1]).toBe(EOL + EOL + "new data");
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
    fs.exists.mockResolvedValue(false);
    fs.readFile.mockResolvedValue("file content");

    // ACT
    const fileContent = await fsUtil.readFileContent(filePath);

    // ASSERT
    expect(fileContent).toBe(null);
  });

  test("readFileContent: throw error", async () => {
    // ARRANGE
    const filePath = path.join(__dirname, ".test-resources", "sample-file.txt");
    fs.exists.mockImplementation(() => {
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
    expect(fs.mkdtemp.mock.calls[0][0]).toBe("/temp/dir");
  });
});
