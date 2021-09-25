const { ScafflaterError } = require("../../errors");

class VersionDoesNotExist extends ScafflaterError {
  constructor(sourceKey, version) {
    super(
      `Theres no version '${version}' available on template source: ${sourceKey}.`
    );
    this.sourceKey = sourceKey;
  }
}

module.exports = VersionDoesNotExist;
