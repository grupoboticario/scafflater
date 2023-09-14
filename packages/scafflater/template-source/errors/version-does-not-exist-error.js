import { ScafflaterError } from "../../errors";

export default class VersionDoesNotExist extends ScafflaterError {
  constructor(sourceKey, version) {
    super(
      `Theres no version '${version}' available on template source: ${sourceKey}.`
    );
    this.sourceKey = sourceKey;
  }
}
