/* eslint-disable no-undef */
const HomeDirCache = require("./home-dir-cache");
const os = require("os");

jest.mock("os");

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
