module.exports = {
  ...require("./github-client-template-source/errors"),
  ...require("./git-template-source/errors"),
  GitTemplateSource: require("./git-template-source"),
  GithubClientTemplateSource: require("./github-client-template-source"),
  IsomorphicGitTemplateSource: require("./isomorphic-git-template-source"),
  TemplateSource: require("./template-source"),
  LocalFolderTemplateSource: require("./local-folder-template-source"),
};
