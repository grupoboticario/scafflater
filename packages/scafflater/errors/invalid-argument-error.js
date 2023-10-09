import ScafflaterError from "./scafflater-error.js";

export default class InvalidArgumentError extends ScafflaterError {
  constructor(argName, argValue) {
    super(`'${argValue}' is not a valid value for '${argName}'`);
    this.argName = argName;
    this.argValue = argValue;
    this.name = "InvalidArgumentError";
  }
}
