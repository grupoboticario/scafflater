const { ScafflaterError } = require("../../../errors");

class GitNotInstalledError extends ScafflaterError {
  constructor() {
    super(
      `The git client is not installed.\nPlease visit https://github.com/git-guides/install-git and install it.`
    );
    this.name = "GitNotInstalledError";
  }
}

module.exports = GitNotInstalledError;
