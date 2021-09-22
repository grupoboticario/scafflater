const { ScafflaterError } = require("../../../errors");

class GitUserNotLoggedError extends ScafflaterError {
  constructor() {
    super(`You are not logged into any Git hosts.`);
    this.name = "GitUserNotLoggedError";
  }
}

module.exports = GitUserNotLoggedError;
