const fsUtils = require(".");
const fs = require("fs-extra");
jest.mock("fs-extra");

describe("Mock glob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Write JSON with indent", async () => {
    // ARRANGE
    const obj = { prop: "prop value" };
    const folderPath = "some/path";

    // ACT
    await fsUtils.writeJSON(folderPath, obj);

    // ASSERT
    expect(fs.writeFile).toHaveBeenCalledWith(
      folderPath,
      `{
  "prop": "prop value"
}`
    );
  });

  test("Write JSON without indent", async () => {
    // ARRANGE
    const obj = { prop: "prop value" };
    const folderPath = "some/path";

    // ACT
    await fsUtils.writeJSON(folderPath, obj, false);

    // ASSERT
    expect(fs.writeFile).toHaveBeenCalledWith(
      folderPath,
      '{"prop":"prop value"}'
    );
  });
});
