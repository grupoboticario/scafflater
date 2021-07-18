const npmInstall = require("./npmInstall");
const { exec } = require("child_process");

jest.mock("child_process");

describe("npmInstall", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test("npmInstall", async () => {
    // ARRANGE
    exec.mockImplementationOnce((cmd, opt, callback) => {
      callback();
    });
    exec.mockImplementationOnce((cmd, opt, callback) => {
      callback(new Error("one error ocurred"));
    });

    // ACT
    await npmInstall("some/folder");
    const callWithError = npmInstall("some/folder");

    // ASSERT
    expect(exec).toHaveBeenCalledWith(
      "npm install",
      { cwd: "some/folder" },
      expect.anything()
    );
    await expect(callWithError).rejects.toThrow("one error ocurred");
  });
});
