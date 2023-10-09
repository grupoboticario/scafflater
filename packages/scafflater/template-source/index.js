import TemplateSource from "./template-source.js";
import GitTemplateSource from "./git-template-source/index.js";
import GithubClientTemplateSource from "./github-client-template-source/index.js";
import IsomorphicGitTemplateSource from "./isomorphic-git-template-source/index.js";
import LocalFolderTemplateSource from "./local-folder-template-source/index.js";

export default TemplateSource;
export * from "./git-template-source/errors/index.js";
export * from "./github-client-template-source/errors/index.js";
export {
  GitTemplateSource,
  GithubClientTemplateSource,
  IsomorphicGitTemplateSource,
  LocalFolderTemplateSource,
};
