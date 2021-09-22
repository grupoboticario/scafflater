const { ScafflaterError } = require("../../errors");

class CannotGetSourceError extends ScafflaterError {
  constructor(sourceKey) {
    super(`Cannot get template source: ${sourceKey}.`);
    this.sourceKey = sourceKey;
  }
}

module.exports = CannotGetSourceError;
