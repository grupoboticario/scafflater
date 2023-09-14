import { jest } from "@jest/globals";

jest.unstable_mockModule("child_process", () => {
  return {
    exec: jest.fn(),
  };
});

const { exec } = await import("child_process");
const npmInstall = (await import("./npmInstall")).default;

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
