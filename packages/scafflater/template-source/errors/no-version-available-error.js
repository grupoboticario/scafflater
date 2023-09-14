import { ScafflaterError } from "../../errors";

export default class NoVersionAvailableError extends ScafflaterError {
  constructor(sourceKey) {
    super(`Theres no version available on template source: ${sourceKey}.`);
    this.sourceKey = sourceKey;
  }
}
