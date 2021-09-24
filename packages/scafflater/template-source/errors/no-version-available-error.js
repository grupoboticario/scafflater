const { ScafflaterError } = require("../../errors");

class NoVersionAvailableError extends ScafflaterError {
  constructor(sourceKey) {
    super(`Theres no version available on template source: ${sourceKey}.`);
    this.sourceKey = sourceKey;
  }
}

module.exports = NoVersionAvailableError;
