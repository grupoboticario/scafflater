import { jest } from "@jest/globals";

jest.unstable_mockModule("../../fs-util", () => {
  const ret = {
    getTempFolderSync: jest.fn(),
  };
  return {
    default: ret,
    ...ret,
  };
});

const fsUtil = await import("../../fs-util");
const TempDirCache = (await import("./temp-dir-cache")).default;

describe("Home Dir source", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Should set path to .scafflater/templates in UserDir", async () => {
    // ARRANGE
    fsUtil.getTempFolderSync.mockReturnValue("some/temp/path");

    // ACT
    const tempDirCache = new TempDirCache();

    // ASSERT
    expect(tempDirCache.storagePath).toBe("some/temp/path");
  });
});
