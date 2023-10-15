import { jest } from "@jest/globals";
import { LocalTemplate } from "../../scafflater-config/local-template";
import {
  ScafflaterFileNotFoundError,
  TemplateDefinitionNotFound,
} from "../../errors";
import {
  GithubClientNotInstalledError,
  GithubClientUserNotLoggedError,
} from "./errors";

jest.unstable_mockModule("../../fs-util", () => {
  const mock = {
    pathExists: jest.fn(),
    getTempFolder: jest.fn(),
    getTempFolderSync: jest.fn(),
    copy: jest.fn(),
  };
  return {
    default: mock,
    ...mock,
  };
});

jest.unstable_mockModule("child_process", () => {
  const mock = {
    exec: jest.fn(),
  };
  return {
    default: mock,
    ...mock,
  };
});

const fsUtil = await import("../../fs-util");
const GithubClientTemplateSource = (
  await import("./github-client-template-source")
).default;
const childProcess = await import("child_process");

describe("getTemplate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Parse repo address", () => {
    // ARRANGE
    const repo1 = "https://github.com/org1/repo1";
    const repo2 = "https://github.com/org2/repo2.git";
    const repo3 = "git@github.com:org3/repo3.git";
    const repo4 = "org4/repo4";

    // ACT
    const { org: org1, repo: repoName1 } =
      GithubClientTemplateSource.parseRepoAddress(repo1);
    const { org: org2, repo: repoName2 } =
      GithubClientTemplateSource.parseRepoAddress(repo2);
    const { org: org3, repo: repoName3 } =
      GithubClientTemplateSource.parseRepoAddress(repo3);
    const { org: org4, repo: repoName4 } =
      GithubClientTemplateSource.parseRepoAddress(repo4);

    // ASSERT
    expect(org1).toBe("org1");
    expect(org2).toBe("org2");
    expect(org3).toBe("org3");
    expect(org4).toBe("org4");

    expect(repoName1).toBe("repo1");
    expect(repoName2).toBe("repo2");
    expect(repoName3).toBe("repo3");
    expect(repoName4).toBe("repo4");
  });

  test("GH is not installed, should throw.", async () => {
    let callBack;
    childProcess.exec.mockImplementation((__, cb) => {
      callBack = cb;
    });
    const promise = GithubClientTemplateSource.checkGhClient();

    callBack(
      new Error("Command failed: asdasd\n/bin/sh: asdasd: command not found\n"),
      "",
      "/bin/sh: asdasd: command not found\n",
    );

    await expect(promise).rejects.toThrow(GithubClientNotInstalledError);
  });

  test("User is not logged, should throw.", async () => {
    let callBack;
    childProcess.exec.mockImplementation((__, cb) => {
      callBack = cb;
    });
    const promise = GithubClientTemplateSource.checkGhClient();

    callBack(
      new Error(
        "Command failed: gh auth status\nYou are not logged into any GitHub hosts. Run gh auth login to authenticate.\n",
      ),
      "",
      "You are not logged into any GitHub hosts. Run gh auth login to authenticate.\n",
    );

    await expect(promise).rejects.toThrow(GithubClientUserNotLoggedError);
  });

  test("Check Auth", async () => {
    let callBack;
    childProcess.exec.mockImplementation((__, cb) => {
      callBack = cb;
    });
    const promise = GithubClientTemplateSource.checkGhClient();

    callBack(
      null,
      "",
      "github.com\n  ✓ Logged in to github.com as chicoribas (/Users/ribasf/.config/gh/hosts.yml)\n  ✓ Git operations for github.com configured to use https protocol.\n  ✓ Token: *******************\n  \n",
    );

    // ASSERT
    await expect(promise).resolves.toBe(true);
  });

  test(".scafflater file not found", async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(false);
    const githuClientTemplateSource = new GithubClientTemplateSource();
    childProcess.exec.mockImplementation((__, cb) => {
      cb(null);
    });
    const promise = githuClientTemplateSource.getTemplate(
      "https://github.com/github/path",
      null,
      "/some/virtual/folder",
    );

    // ACT && ASSERT
    await expect(promise).rejects.toBeInstanceOf(ScafflaterFileNotFoundError);
  });

  test("Template definition not found on .scafflater", async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(true);
    jest.spyOn(LocalTemplate, "loadFromPath").mockResolvedValue(null);
    const githubClientTemplateSource = new GithubClientTemplateSource();

    childProcess.exec.mockImplementation((__, cb) => {
      cb(null);
    });
    const promise = githubClientTemplateSource.getTemplate(
      "https://github.com/github/path",
      null,
      "/some/virtual/folder",
    );

    // ACT && ASSERT
    await expect(promise).rejects.toThrow(TemplateDefinitionNotFound);
  });

  test("Valid source key", () => {
    expect(
      GithubClientTemplateSource.isValidSourceKey(
        "https://github.com/some-org/some-repo",
      ),
    ).toBeTruthy();
    expect(
      GithubClientTemplateSource.isValidSourceKey(
        "git@github.com:some-org/some-repo.git",
      ),
    ).toBeTruthy();
    expect(
      GithubClientTemplateSource.isValidSourceKey(
        "https://dev.azure.com/some-org/some-repo",
      ),
    ).toBeFalsy();
  });

  test("Config with username and password", () => {
    // ARRANGE
    const options = {
      githubUsername: "some-user",
      githubPassword: "the-secret-password",
    };

    // ACT
    const ts = new GithubClientTemplateSource(options);

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
    const githubClientTemplateSource = new GithubClientTemplateSource();
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
          [{ name: "some-parameter" }],
        ),
      ]);

    childProcess.exec.mockImplementation((__, cb) => {
      cb(null);
    });

    // ACT
    const promise = githubClientTemplateSource.getTemplate(
      repo,
      null,
      virtualFolder,
    );
    const out = await promise;

    // ASSERT
    const expected = new LocalTemplate(
      "/some/virtual/folder",
      "template-name",
      "the template",
      "0.0.0",
      [],
      {},
      [{ name: "some-parameter" }],
    );
    expect(out).toBeInstanceOf(LocalTemplate);
    expect(out).toStrictEqual(expected);
    expect(childProcess.exec).toHaveBeenCalledWith(
      "gh repo clone some/repo temp/folder",
      expect.anything(),
    );
  });

  test("Should clone to a temp folder", async () => {
    // ARRANGE
    const repo = "some/repo";
    const githubClientTemplateSource = new GithubClientTemplateSource();
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
          [{ name: "some-parameter" }],
        ),
      ]);

    childProcess.exec.mockImplementation((__, cb) => {
      cb(null);
    });

    // ACT
    const promise = githubClientTemplateSource.getTemplate(repo);
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
        [{ name: "some-parameter" }],
      ),
    );
    expect(childProcess.exec).toHaveBeenCalledWith(
      "gh repo clone some/repo temp/folder",
      expect.anything(),
    );
  });
});
