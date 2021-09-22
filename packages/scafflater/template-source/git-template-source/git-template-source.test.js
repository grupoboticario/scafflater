/* eslint-disable no-undef */
const GitTemplateSource = require("./git-template-source");
const fsUtil = require("../../fs-util");
const { LocalTemplate } = require("../../scafflater-config/local-template");
const {
  ScafflaterFileNotFoundError,
  TemplateDefinitionNotFound,
} = require("../../errors");
const child_process = require("child_process");
const { GitNotInstalledError, GitUserNotLoggedError } = require("./errors");

jest.mock("../../fs-util");
jest.mock("child_process");

describe("getTemplate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Git is not installed, should throw.", async () => {
    let callBack;
    child_process.exec.mockImplementation((__, ___, cb) => {
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
    let callBack;
    child_process.exec.mockImplementation((__, ___, cb) => {
      callBack = cb;
    });
    const promise = GitTemplateSource.checkGitClient();

    callBack(null, "", "");

    await expect(promise).rejects.toThrow(GitUserNotLoggedError);
  });

  test("Check Auth", async () => {
    let callBack;
    child_process.exec.mockImplementation((__, ___, cb) => {
      callBack = cb;
    });
    const promise = GitTemplateSource.checkGitClient();

    callBack(null, "", "username");

    //ASSERT
    await expect(promise).resolves.toBe(true);
  });

  test(".scafflater file not found", async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(false);
    const gitTemplateSource = new GitTemplateSource();
    let callBack;
    child_process.exec.mockImplementation((__, ___, cb) => {
      callBack = cb;
    });
    const promise = gitTemplateSource.getTemplate(
      "https://github.com/github/path",
      "/some/virtual/folder"
    );

    callBack(null);

    // ACT && ASSERT
    await expect(promise).rejects.toBeInstanceOf(ScafflaterFileNotFoundError);
  });

  test("Template definition not found on .scafflater", async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(true);
    jest.spyOn(LocalTemplate, "loadFromPath").mockResolvedValue(null);
    const gitTemplateSource = new GitTemplateSource();

    let callBack;
    child_process.exec.mockImplementation((__, ___, cb) => {
      callBack = cb;
    });
    const promise = gitTemplateSource.getTemplate(
      "https://github.com/github/path",
      "/some/virtual/folder"
    );

    callBack(null);

    // ACT && ASSERT
    await expect(promise).rejects.toThrow(TemplateDefinitionNotFound);
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

    let callBack;
    child_process.exec.mockImplementation((__, ___, cb) => {
      callBack = cb;
    });

    // ACT
    const promise = gitTemplateSource.getTemplate(repo, virtualFolder);
    callBack(null);
    const out = await promise;

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
    expect(child_process.exec).toHaveBeenCalledWith(
      "git clone some/repo temp/folder",
      expect.anything(),
      expect.anything()
    );
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

    let callBack;
    child_process.exec.mockImplementation((__, ___, cb) => {
      callBack = cb;
    });

    // ACT
    const promise = gitTemplateSource.getTemplate(repo);
    callBack(null);
    const out = await promise;

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
    expect(child_process.exec).toHaveBeenCalledWith(
      "git clone some/repo temp/folder",
      expect.anything(),
      expect.anything()
    );
  });
});
