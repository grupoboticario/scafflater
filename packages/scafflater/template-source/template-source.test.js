/* eslint-disable no-undef */
const TemplateSource = require("./template-source");
const IsomorphicGitTemplateSource = require("./isomorphic-git-template-source");

test("Resolve template source", () => {
  // ARRANGE
  const config = {
    source: "isomorphicGit",
    sources: {
      git: "./git-template-source",
      githubClient: "./github-client-template-source",
      isomorphicGit: "./isomorphic-git-template-source",
      localFolder: "./local-folder-template-source",
    },
  };

  // ACT
  const out = TemplateSource.resolveTemplateSourceFromSourceKey(
    config,
    "https://github.com/chicoribas/scafflater-template"
  );

  // ASSERT
  expect(out).toBeInstanceOf(IsomorphicGitTemplateSource);
});

test("Throws an exception when the source does not exists", () => {
  // ARRANGE
  const config = { source: "bla" };

  // ACT and ASSERT
  expect(() => {
    TemplateSource.getTemplateSource(config);
  }).toThrowError("There's no module for source 'bla'");
});

test("Gets the template source in config", () => {
  // ARRANGE
  const config = { source: "isomorphicGit" };

  // ACT
  const result = TemplateSource.getTemplateSource(config);

  // ASSERT
  // eslint-disable-next-line no-proto
  expect(result.__proto__ instanceof TemplateSource).toBe(true);
  expect(result instanceof IsomorphicGitTemplateSource).toBe(true);
});

test("Gets the github source from a github source key", () => {
  // ARRANGE
  const config = {};
  const sourceKey = "https://github.com/jekyll/jekyll.git";

  // ACT
  const result = TemplateSource.getTemplateSource(sourceKey, config);

  // ASSERT
  // eslint-disable-next-line no-proto
  expect(result.__proto__ instanceof TemplateSource).toBe(true);
  expect(result instanceof IsomorphicGitTemplateSource).toBe(true);
});
