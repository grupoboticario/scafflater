import { ScafflaterError } from "../../../errors/index.js";

export default class GithubClientUserNotLoggedError extends ScafflaterError {
  constructor() {
    super(
      `You are not logged into any GitHub hosts. Run gh auth login to authenticate.`
    );
    this.name = "GithubClientUserNotLoggedError";
  }
}
