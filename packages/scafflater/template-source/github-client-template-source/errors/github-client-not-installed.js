import { ScafflaterError } from "../../../errors/index.js";

export default class GithubClientNotInstalledError extends ScafflaterError {
  constructor() {
    super(
      `The github client is not installed.\nPlease visit https://cli.github.com/ and install it.`,
    );
    this.name = "GithubClientNotInstalledError";
  }
}
