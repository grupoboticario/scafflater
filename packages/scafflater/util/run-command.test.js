/* eslint-disable no-undef */
const { runCommand } = require("./run-command");
const { exec } = require("child_process");

jest.mock("child_process");

describe("runCommand", () => {
  test("Execute Command Successfully", async () => {
    // ARRANGE
    const putStdout = [];
    const putOn = [];
    const process = {
      stdout: {
        setEncoding: jest.fn(),
        on: (event, fn) => {
          putStdout[event] = fn;
        },
      },
      stderr: {
        setEncoding: jest.fn(),
        on: jest.fn(),
      },
      on: (event, fn) => {
        putOn[event] = fn;
      },
    };
    exec.mockReturnValue(process);

    // ACT
    const premise = runCommand("ls");
    putStdout.data("test_output");
    putOn.close(0);

    // ASSERT
    await expect(premise).resolves.toBe("test_output");
  });

  test("Execute Command with error messages", async () => {
    // ARRANGE
    const putStderr = [];
    const putOn = [];
    const process = {
      stdout: {
        setEncoding: jest.fn(),
        on: jest.fn(),
      },
      stderr: {
        setEncoding: jest.fn(),
        on: (event, fn) => {
          putStderr[event] = fn;
        },
      },
      on: (event, fn) => {
        putOn[event] = fn;
      },
    };
    exec.mockReturnValue(process);

    // ACT
    const premise = runCommand("ls");
    putStderr.data("ERROR MESSAGE");
    putOn.close(1);

    // ASSERT
    await expect(premise).rejects.toThrow(
      "Error: Command ls failed, exit code 1: ERROR MESSAGE"
    );
  });

  test("Command throws an error", async () => {
    // ARRANGE
    const putOn = [];
    const process = {
      stdout: {
        setEncoding: jest.fn(),
        on: jest.fn(),
      },
      stderr: {
        setEncoding: jest.fn(),
        on: jest.fn(),
      },
      on: (event, fn) => {
        putOn[event] = fn;
      },
    };
    exec.mockReturnValue(process);

    // ACT
    const premise = runCommand("ls");
    putOn.error("ERROR MESSAGE");

    // ASSERT
    await expect(premise).rejects.toBe("ERROR MESSAGE");
  });
});
