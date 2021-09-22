/* eslint-disable no-undef */
const IsomorphicGitTemplateSource = require("./isomorphic-git-template-source");
const GitUtil = require("../git-util");
const fsUtil = require("../fs-util");
const TemplateSource = require(".");
const { LocalTemplate } = require("../scafflater-config/local-template");
const {
  ScafflaterFileNotFoundError,
  TemplateDefinitionNotFound,
} = require("../errors");

jest.mock("../git-util");
jest.mock("../fs-util");

describe("getTemplate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test(".scafflater file not found", async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(false);
    const isomorphicGitTemplateSource = new IsomorphicGitTemplateSource();

    // ACT && ASSERT
    await expect(
      isomorphicGitTemplateSource.getTemplate(
        "http://some/github/path",
        "/some/virtual/folder"
      )
    ).rejects.toThrow(ScafflaterFileNotFoundError);
  });
  test("Template definition not found on .scafflater", async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(true);
    jest.spyOn(LocalTemplate, "loadFromPath").mockResolvedValue(null);
    const isomorphicGitTemplateSource = new IsomorphicGitTemplateSource();

    // ACT && ASSERT
    await expect(
      isomorphicGitTemplateSource.getTemplate(
        "http://some/github/path",
        "/some/virtual/folder"
      )
    ).rejects.toThrow(TemplateDefinitionNotFound);
  });

  test("Valid source key", () => {
    expect(
      IsomorphicGitTemplateSource.isValidSourceKey(
        "https://github.com/some-org/some-repo"
      )
    ).toBeTruthy();
    expect(
      IsomorphicGitTemplateSource.isValidSourceKey(
        "http://github.com/some-org/some-repo"
      )
    ).toBeTruthy();
    expect(
      IsomorphicGitTemplateSource.isValidSourceKey(
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
    const ts = new TemplateSource(options);

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
          [{ name: "some-parameter" }]
        ),
      ]);

    // ACT
    const out = await isomorphicGitTemplateSource.getTemplate(
      repo,
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
    expect(GitUtil.clone.mock.calls[0][0]).toBe(repo);
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
          [{ name: "some-parameter" }]
        ),
      ]);

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
        [{ name: "some-parameter" }]
      )
    );
    expect(GitUtil.clone.mock.calls[0][0]).toBe(repo);
  });
});
