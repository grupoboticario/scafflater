import TemplateSource from "./template-source";
import GitTemplateSource from "./git-template-source";
import GithubClientTemplateSource from "./github-client-template-source";
import IsomorphicGitTemplateSource from "./isomorphic-git-template-source";
import LocalFolderTemplateSource from "./local-folder-template-source";

export default TemplateSource;
export * from "./git-template-source/errors";
export * from "./github-client-template-source/errors";
export {
  GitTemplateSource,
  GithubClientTemplateSource,
  IsomorphicGitTemplateSource,
  LocalFolderTemplateSource,
};
