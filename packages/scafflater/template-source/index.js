module.exports = {
  ...require("./github-client-template-source/errors"),
  GithubClientTemplateSource: require("./github-client-template-source"),
  IsomorphicGitTemplateSource: require("./isomorphic-git-template-source"),
  TemplateSource: require("./template-source"),
  LocalFolderTemplateSource: require("./local-folder-template-source"),
};
