import { jest } from "@jest/globals";

jest.unstable_mockModule("os", () => {
  const ret = {
    homedir: jest.fn(),
  };
  return {
    default: ret,
    ...ret,
  };
});

const os = await import("os");
const HomeDirCache = (await import("./home-dir-cache")).default;

describe("Home Dir source", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Should set path to .scafflater/templates in UserDir", async () => {
    // ARRANGE
    os.homedir.mockReturnValue("/User/Home/Dir");

    // ACT
    const homeDirCache = new HomeDirCache();

    // ASSERT
    expect(homeDirCache.storagePath).toBe(
      "/User/Home/Dir/.scafflater/templates"
    );
  });
});
