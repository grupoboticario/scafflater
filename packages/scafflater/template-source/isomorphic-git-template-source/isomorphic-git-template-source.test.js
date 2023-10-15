import { jest } from "@jest/globals";
import { LocalTemplate } from "../../scafflater-config/local-template";
import {
  ScafflaterFileNotFoundError,
  TemplateDefinitionNotFound,
} from "../../errors";
import git from "isomorphic-git";

jest.mock("../../fs-util");

jest.unstable_mockModule("../../fs-util", () => {
  const mock = {
    pathExists: jest.fn(),
    getFolder: jest.fn(),
    getTempFolder: jest.fn(),
    copy: jest.fn(),
  };

  return {
    default: mock,
    ...mock,
  };
});

const fsUtil = await import("../../fs-util");
const IsomorphicGitTemplateSource = (
  await import("./isomorphic-git-template-source")
).default;

describe("getTemplate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test(".scafflater file not found", async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(false);
    const isomorphicGitTemplateSource = new IsomorphicGitTemplateSource();
    jest.spyOn(git, "clone").mockResolvedValue(true);

    // ACT && ASSERT
    await expect(
      isomorphicGitTemplateSource.getTemplate(
        "http://some/github/path",
        null,
        "/some/virtual/folder",
      ),
    ).rejects.toThrow(ScafflaterFileNotFoundError);
  });
  test("Template definition not found on .scafflater", async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(true);
    jest.spyOn(LocalTemplate, "loadFromPath").mockResolvedValue(null);
    const isomorphicGitTemplateSource = new IsomorphicGitTemplateSource();
    jest.spyOn(git, "clone").mockResolvedValue(true);

    // ACT && ASSERT
    await expect(
      isomorphicGitTemplateSource.getTemplate(
        "http://some/github/path",
        null,
        "/some/virtual/folder",
      ),
    ).rejects.toThrow(TemplateDefinitionNotFound);
  });

  test("Valid source key", () => {
    expect(
      IsomorphicGitTemplateSource.isValidSourceKey(
        "https://github.com/some-org/some-repo",
      ),
    ).toBeTruthy();
    expect(
      IsomorphicGitTemplateSource.isValidSourceKey(
        "http://github.com/some-org/some-repo",
      ),
    ).toBeTruthy();
    expect(
      IsomorphicGitTemplateSource.isValidSourceKey(
        "https://dev.azure.com/some-org/some-repo",
      ),
    ).toBeFalsy();
  });

  test("Config with username and password", async () => {
    // ARRANGE
    const options = {
      githubUsername: "some-user",
      githubPassword: "the-secret-password",
    };
    jest.spyOn(git, "clone").mockResolvedValue(true);
    jest.spyOn(fsUtil, "getTempFolder").mockResolvedValue("some/temp/folder");
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
    fsUtil.pathExists.mockResolvedValue(true);

    // ACT
    const ts = new IsomorphicGitTemplateSource(options);
    await ts.getTemplate("https://github.com/some/repo");

    // ASSERT
    expect(ts.options.githubUsername).toBe("some-user");
    expect(ts.options.githubPassword).toBe("the-secret-password");
    expect(ts.options.githubBaseUrlApi).toBe("https://api.github.com");
    expect(ts.options.githubBaseUrl).toBe("https://github.com");
    expect(git.clone).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {
          Authorization: `Basic ${Buffer.from(
            "some-user:the-secret-password",
          ).toString("base64")}`,
        },
      }),
    );
  });

  test("Should clone to the folder in parameter", async () => {
    // ARRANGE
    const repo = "some/repo";
    const virtualFolder = "/some/virtual/folder";
    const isomorphicGitTemplateSource = new IsomorphicGitTemplateSource();
    fsUtil.pathExists.mockResolvedValue(true);
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
    jest.spyOn(git, "clone").mockResolvedValue(true);

    // ACT
    const out = await isomorphicGitTemplateSource.getTemplate(
      repo,
      virtualFolder,
    );

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
    expect(git.clone).toHaveBeenCalledWith(
      expect.objectContaining({ url: repo }),
    );
  });

  test("Should clone to a temp folder", async () => {
    // ARRANGE
    const repo = "some/repo";
    const isomorphicGitTemplateSource = new IsomorphicGitTemplateSource();
    jest.spyOn(fsUtil, "getTempFolder").mockResolvedValue("some/temp/folder");
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
    jest.spyOn(git, "clone").mockResolvedValue(true);

    // ACT
    const out = await isomorphicGitTemplateSource.getTemplate(repo);

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
    expect(git.clone).toHaveBeenCalledWith(
      expect.objectContaining({ url: repo }),
    );
  });
});
