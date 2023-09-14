import { ScafflaterError } from "../../../errors";

export default class GitUserNotLoggedError extends ScafflaterError {
  constructor() {
    super(`You are not logged into any Git hosts.`);
    this.name = "GitUserNotLoggedError";
  }
}
