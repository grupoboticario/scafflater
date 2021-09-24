const ScafflaterError = require("./scafflater-error");

class InvalidArgumentError extends ScafflaterError {
  constructor(argName, argValue) {
    super(`'${argValue}' is not a valid value for '${argName}'`);
    this.argName = argName;
    this.argValue = argValue;
    this.name = "InvalidArgumentError";
  }
}

module.exports = InvalidArgumentError;
