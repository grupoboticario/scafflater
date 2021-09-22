class GitUserNotLoggedError extends Error {
  constructor() {
    super(`You are not logged into any Git hosts.`);
    this.name = "GithubClientUserNotLoggedError";
  }
}

module.exports = GitUserNotLoggedError;
