/* eslint-disable no-undef */
const GitTemplateSource = require("./git-template-source");
const fsUtil = require("../../fs-util");
const { LocalTemplate } = require("../../scafflater-config/local-template");
const {
  ScafflaterFileNotFoundError,
  TemplateDefinitionNotFound,
} = require("../../errors");
const childProcess = require("child_process");
const { GitNotInstalledError, GitUserNotLoggedError } = require("./errors");
const util = require("util");

jest.mock("../../fs-util");
jest.mock("child_process");

describe("getTemplate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Git is not installed, should throw.", async () => {
    let callBack;
    childProcess.exec.mockImplementation((__, ___, cb) => {
      callBack = cb;
    });
    const promise = GitTemplateSource.checkGitClient();

    callBack(
      new Error("Command failed: asdasd\n/bin/sh: asdasd: command not found\n"),
      "",
      "/bin/sh: asdasd: command not found\n"
    );

    await expect(promise).rejects.toThrow(GitNotInstalledError);
  });

  test("User is not logged in git, should throw.", async () => {
    jest.spyOn(util, "promisify").mockReturnValue(() => {
      return { stdout: "", stderr: "" };
    });

    await expect(GitTemplateSource.checkGitClient()).rejects.toThrow(
      GitUserNotLoggedError
    );
  });

  test("Check Auth", async () => {
    jest.spyOn(util, "promisify").mockReturnValue(() => {
      return { stdout: "username", stderr: "" };
    });

    await expect(GitTemplateSource.checkGitClient()).resolves.toBe(true);
  });

  test(".scafflater file not found", async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(false);
    const gitTemplateSource = new GitTemplateSource();

    jest.spyOn(util, "promisify").mockReturnValue(() => {
      return { stdout: "", stderr: "username" };
    });

    // ACT && ASSERT
    await expect(
      gitTemplateSource.getTemplate(
        "https://github.com/github/path",
        "/some/virtual/folder"
      )
    ).rejects.toBeInstanceOf(ScafflaterFileNotFoundError);
  });

  test("Template definition not found on .scafflater", async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(true);
    jest.spyOn(LocalTemplate, "loadFromPath").mockResolvedValue(null);
    jest.spyOn(util, "promisify").mockReturnValue(() => {
      return { stdout: "", stderr: "username" };
    });

    // ACT && ASSERT
    await expect(
      new GitTemplateSource().getTemplate(
        "https://github.com/github/path",
        "/some/virtual/folder"
      )
    ).rejects.toThrow(TemplateDefinitionNotFound);
  });

  test("Valid source key", () => {
    expect(
      GitTemplateSource.isValidSourceKey(
        "https://github.com/some-org/some-repo"
      )
    ).toBeTruthy();
    expect(
      GitTemplateSource.isValidSourceKey("http://github.com/some-org/some-repo")
    ).toBeTruthy();
    expect(
      GitTemplateSource.isValidSourceKey(
        "https://dev.azure.com/some-org/some-repo"
      )
    ).toBeFalsy();
  });

  test("Config with username and password", () => {
    // ARRANGE
    const options = {
      githubUsername: "some-user",
      githubPassword: "the-secret-password",
    };

    // ACT
    const ts = new GitTemplateSource(options);

    // ASSERT
    expect(ts.options.githubUsername).toBe("some-user");
    expect(ts.options.githubPassword).toBe("the-secret-password");
    expect(ts.options.githubBaseUrlApi).toBe("https://api.github.com");
    expect(ts.options.githubBaseUrl).toBe("https://github.com");
  });

  test("Should clone to the folder in parameter", async () => {
    // ARRANGE
    const repo = "some/repo";
    const virtualFolder = "/some/virtual/folder";
    const gitTemplateSource = new GitTemplateSource();
    fsUtil.pathExists.mockResolvedValue(true);
    fsUtil.getTempFolderSync.mockReturnValue("temp/folder");
    jest
      .spyOn(LocalTemplate, "loadFromPath")
      .mockResolvedValue([
        new LocalTemplate(
          "/some/virtual/folder",
          "template-name",
          "the template",
          "0.0.0",
          [],
          {},
          [{ name: "some-parameter" }]
        ),
      ]);
    let cmd = "";
    jest.spyOn(util, "promisify").mockReturnValue((command) => {
      cmd = command;
      return { stdout: "", stderr: "username" };
    });

    // ACT
    const out = await gitTemplateSource.getTemplate(repo, virtualFolder);

    // ASSERT
    const expected = new LocalTemplate(
      "/some/virtual/folder",
      "template-name",
      "the template",
      "0.0.0",
      [],
      {},
      [{ name: "some-parameter" }]
    );
    expect(out).toBeInstanceOf(LocalTemplate);
    expect(out).toStrictEqual(expected);
    expect(cmd).toBe("git clone some/repo temp/folder");
  });

  test("Should clone to a temp folder", async () => {
    // ARRANGE
    const repo = "some/repo";
    const gitTemplateSource = new GitTemplateSource();
    jest.spyOn(fsUtil, "getTempFolder").mockReturnValue("some/temp/folder");
    jest
      .spyOn(LocalTemplate, "loadFromPath")
      .mockResolvedValue([
        new LocalTemplate(
          "some/virtual/folder",
          "template-name",
          "the template",
          "0.0.0",
          [],
          {},
          [{ name: "some-parameter" }]
        ),
      ]);
    let cmd = "";
    jest.spyOn(util, "promisify").mockReturnValue((command) => {
      cmd = command;
      return { stdout: "", stderr: "username" };
    });

    // ACT
    const out = await gitTemplateSource.getTemplate(repo);

    // ASSERT
    expect(out).toBeInstanceOf(LocalTemplate);
    expect(out).toStrictEqual(
      new LocalTemplate(
        "some/virtual/folder",
        "template-name",
        "the template",
        "0.0.0",
        [],
        {},
        [{ name: "some-parameter" }]
      )
    );
    expect(cmd).toBe("git clone some/repo temp/folder");
  });
});
