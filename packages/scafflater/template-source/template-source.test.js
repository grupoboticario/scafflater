import TemplateSource from "./template-source";
import IsomorphicGitTemplateSource from "./isomorphic-git-template-source";

test("Resolve template source", async () => {
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
  const out = await TemplateSource.resolveTemplateSourceFromSourceKey(
    config,
    "https://github.com/scafflater/scafflater-template",
  );

  // ASSERT
  expect(out).toBeInstanceOf(IsomorphicGitTemplateSource);
});

test("Throws an exception when the source does not exists", async () => {
  // ARRANGE

  // ACT
  const source = TemplateSource.getTemplateSource({ source: "bla" });

  // ASSERT
  await expect(source).rejects.toThrow("There's no module for source 'bla'");
});

test("Gets the template source in config", async () => {
  // ARRANGE
  const config = { source: "isomorphicGit" };

  // ACT
  const result = await TemplateSource.getTemplateSource(config);

  // ASSERT
  // eslint-disable-next-line no-proto
  expect(result instanceof TemplateSource).toBe(true);
  expect(result instanceof IsomorphicGitTemplateSource).toBe(true);
});

test("Gets the github source from a github source key", async () => {
  // ARRANGE
  const config = {};
  const sourceKey = "https://github.com/jekyll/jekyll.git";

  // ACT
  const result = await TemplateSource.getTemplateSource(sourceKey, config);

  // ASSERT
  // eslint-disable-next-line no-proto
  expect(result instanceof TemplateSource).toBe(true);
  expect(result instanceof IsomorphicGitTemplateSource).toBe(true);
});
