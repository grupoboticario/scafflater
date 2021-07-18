const npmInstall = require("./npmInstall");
const { execSync } = require("child_process");

jest.mock("child_process");

describe("npmInstall", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test("npmInstall", async () => {
    // ARRANGE

    // ACT
    await npmInstall("some/folder");

    // ASSERT
    expect(execSync).toHaveBeenCalledWith("npm install", {
      cwd: "some/folder",
    });
  });
});
