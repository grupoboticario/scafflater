class GithubClientNotInstalledError extends Error {
  constructor() {
    super(
      `The github client is not installed.\nPlease visit https://cli.github.com/ and install it.`
    );
    this.name = "GithubClientNotInstalledError";
  }
}

module.exports = GithubClientNotInstalledError;
