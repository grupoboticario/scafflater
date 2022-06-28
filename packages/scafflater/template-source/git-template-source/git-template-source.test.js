/* eslint-disable no-undef */
const GitTemplateSource = require("./git-template-source");
const fsUtil = require("../../fs-util");
const { LocalTemplate } = require("../../scafflater-config/local-template");
const {
  ScafflaterFileNotFoundError,
  TemplateDefinitionNotFound,
} = require("../../errors");
const { GitNotInstalledError, GitUserNotLoggedError } = require("./errors");
const util = require("util");
const InvalidArgumentError = require("../../errors/invalid-argument-error");
const { NoVersionAvailableError, VersionDoesNotExist } = require("../errors");

jest.mock("../../fs-util");

describe("getTemplate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Git is not installed, should throw.", async () => {
    jest.spyOn(util, "promisify").mockReturnValue(() => {
      throw new Error(
        "Command failed: asdasd\n/bin/sh: asdasd: command not found\n"
      );
    });

    await expect(GitTemplateSource.checkGitClient()).rejects.toThrow(
      GitNotInstalledError
    );
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
    jest.spyOn(fsUtil, "pathExists").mockResolvedValue(false);
    jest.spyOn(fsUtil, "getTempFolder").mockReturnValue("some/temp/folder");
    const gitTemplateSource = new GitTemplateSource();

    jest.spyOn(util, "promisify").mockReturnValue(() => {
      return { stdout: "", stderr: "username" };
    });

    // ACT && ASSERT
    await expect(
      gitTemplateSource.getTemplate(
        "https://github.com/github/path",
        "last",
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
        "last",
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
        "git@github.com:some-org/some-repo.git"
      )
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
    const out = await gitTemplateSource.getTemplate(
      repo,
      "last",
      virtualFolder
    );

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
    expect(cmd).toBe(
      "git clone some/repo temp/folder -c core.protectNTFS=false"
    );
  });

  test("A last version is requested, and there is an tag version. Should clone the version.", async () => {
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
      if (command.startsWith('git ls-remote --tags --sort="v:refname"')) {
        return {
          stdout: `382c92671490ad1435eb5939c1ec8990c784682b    refs/tags/v0.0.62
        382c92671490ad1435eb5939c1ec8990c784682b    refs/tags/v0.0.63^{}
        be21ce85b930b2f615641803d1690de744bdcae8    refs/tags/v0.0.64`,
          stderr: "",
        };
      }

      if (command.startsWith("git config user.name")) {
        return { stdout: "", stderr: "username" };
      }

      if (command.startsWith("git clone")) {
        cmd = command;
      }
    });

    // ACT
    const out = await gitTemplateSource.getTemplate(
      repo,
      "last",
      virtualFolder
    );

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
    expect(cmd).toBe(
      "git clone -b v0.0.64 some/repo temp/folder -c core.protectNTFS=false"
    );
  });

  test("Request an existing tag version. Should clone the version.", async () => {
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
      if (command.startsWith('git ls-remote --tags --sort="v:refname"')) {
        return {
          stdout: `382c92671490ad1435eb5939c1ec8990c784682b    refs/tags/v0.0.62
        382c92671490ad1435eb5939c1ec8990c784682b    refs/tags/v0.0.63^{}
        be21ce85b930b2f615641803d1690de744bdcae8    refs/tags/v0.0.64`,
          stderr: "",
        };
      }

      if (command.startsWith("git config user.name")) {
        return { stdout: "", stderr: "username" };
      }

      if (command.startsWith("git clone")) {
        cmd = command;
      }
    });

    // ACT
    const out = await gitTemplateSource.getTemplate(
      repo,
      "v0.0.62",
      virtualFolder
    );

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
    expect(cmd).toBe(
      "git clone -b v0.0.62 some/repo temp/folder -c core.protectNTFS=false"
    );
  });

  test("Request an non existing tag version. Should throw.", async () => {
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
    jest.spyOn(util, "promisify").mockReturnValue((command) => {
      if (command.startsWith('git ls-remote --tags --sort="v:refname"')) {
        return {
          stdout: `382c92671490ad1435eb5939c1ec8990c784682b    refs/tags/v0.0.62
        382c92671490ad1435eb5939c1ec8990c784682b    refs/tags/v0.0.63^{}
        be21ce85b930b2f615641803d1690de744bdcae8    refs/tags/v0.0.64`,
          stderr: "",
        };
      }

      if (command.startsWith("git config user.name")) {
        return { stdout: "", stderr: "username" };
      }
    });

    // ACT && ASSERT
    await expect(
      gitTemplateSource.getTemplate(repo, "v0.0.61", virtualFolder)
    ).rejects.toThrow(VersionDoesNotExist);
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
    expect(cmd).toBe(
      "git clone some/repo temp/folder -c core.protectNTFS=false"
    );
  });

  test("Check Version is available", async () => {
    jest.spyOn(util, "promisify").mockReturnValue(() => {
      return {
        stdout: `382c92671490ad1435eb5939c1ec8990c784682b    refs/tags/v0.0.63^{}
      be21ce85b930b2f615641803d1690de744bdcae8    refs/tags/v0.0.64`,
        stderr: "",
      };
    });

    await expect(
      new GitTemplateSource().isVersionAvailable(
        "https://github.com/some/repo",
        "new-version"
      )
    ).rejects.toThrow(InvalidArgumentError);

    await expect(
      new GitTemplateSource().isVersionAvailable(
        "https://github.com/some/repo",
        "v0.0.65"
      )
    ).resolves.toBe(false);

    await expect(
      new GitTemplateSource().isVersionAvailable(
        "https://github.com/some/repo",
        "v0.0.63"
      )
    ).resolves.toBe(false);

    await expect(
      new GitTemplateSource().isVersionAvailable(
        "https://github.com/some/repo",
        "v0.0.64"
      )
    ).resolves.toBe(true);

    await expect(
      new GitTemplateSource().isVersionAvailable(
        "https://github.com/some/repo",
        "0.0.64"
      )
    ).resolves.toBe(true);
  });

  test("Get last Version", async () => {
    jest.spyOn(util, "promisify").mockReturnValueOnce(() => {
      return {
        stdout: `382c92671490ad1435eb5939c1ec8990c784682b    refs/tags/v0.0.63^{}
      be21ce85b930b2f615641803d1690de744bdcae8    refs/tags/v0.0.64`,
        stderr: "",
      };
    });
    jest.spyOn(util, "promisify").mockReturnValueOnce(() => {
      return {
        stdout: `382c92671490ad1435eb5939c1ec8990c784682b    refs/tags/0.0.63^{}
      be21ce85b930b2f615641803d1690de744bdcae8    refs/tags/0.0.64`,
        stderr: "",
      };
    });
    jest.spyOn(util, "promisify").mockReturnValueOnce(() => {
      return {
        stdout: `382c92671490ad1435eb5939c1ec8990c784682b    refs/tags/v0.0.63^{}`,
        stderr: "",
      };
    });

    jest.spyOn(util, "promisify").mockReturnValueOnce(() => {
      return {
        stdout: "",
        stderr: "",
      };
    });

    expect(
      await new GitTemplateSource().getLastVersion(
        "https://github.com/some/repo"
      )
    ).toBe("v0.0.64");

    expect(
      await new GitTemplateSource().getLastVersion(
        "https://github.com/some/repo"
      )
    ).toBe("0.0.64");

    await expect(
      new GitTemplateSource().getLastVersion("https://github.com/some/repo")
    ).rejects.toThrow(NoVersionAvailableError);

    await expect(
      new GitTemplateSource().getLastVersion("https://github.com/some/repo")
    ).rejects.toThrow(NoVersionAvailableError);
  });
});
