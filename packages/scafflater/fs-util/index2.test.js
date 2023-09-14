import { jest } from "@jest/globals";

jest.unstable_mockModule("glob", () => {
  return jest.createMockFromModule("glob");
});

const { glob } = await import("glob");
const { listFilesDeeply, listFilesByExtensionDeeply, listFilesByNameDeeply } = (
  await import("./index")
).default;

describe("Mock glob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Glob throws an exception", async () => {
    // ARRANGE
    glob.mockImplementation(() => {
      throw new Error("Glob throws an exception");
    });

    // ACT & ASSERT
    await expect(
      listFilesDeeply("folderPath", "__...........__")
    ).rejects.toThrow();
  });

  test("listFilesByExtensionDeeply", async () => {
    // ARRANGE
    glob.mockResolvedValue(["some-file"]);

    // ACT
    await listFilesByExtensionDeeply("folder/path", "ext");

    // ASSERT
    expect(glob.mock.calls[0][0]).toBe("/**/*.ext");
    expect(glob.mock.calls[0][1]).toStrictEqual({ root: "folder/path" });
  });

  test("listFilesByNameDeeply", async () => {
    // ARRANGE
    glob.mockResolvedValue(["some-file"]);

    // ACT
    await listFilesByNameDeeply("folder/path", "my-file.ext");

    // ASSERT
    expect(glob.mock.calls[0][0]).toBe("/**/my-file.ext");
    expect(glob.mock.calls[0][1]).toStrictEqual({ root: "folder/path" });
  });
});
