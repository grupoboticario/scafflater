import { jest } from "@jest/globals";

jest.unstable_mockModule("fs-extra", () => {
  const ret = jest.createMockFromModule("fs-extra");
  return {
    ...ret,
    default: ret,
  };
});

const fsUtils = (await import("./index")).default;
const fs = await import("fs-extra");

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
}`,
    );
  });

  test("Write JSON without indent", async () => {
    // ARRANGE
    const obj = { prop: "prop value" };
    const folderPath = "some/path";

    // ACT
    fsUtils.writeJSON(folderPath, obj, false);

    // ASSERT
    expect(fs.writeFile).toHaveBeenCalledWith(
      folderPath,
      '{"prop":"prop value"}',
    );
  });
});
