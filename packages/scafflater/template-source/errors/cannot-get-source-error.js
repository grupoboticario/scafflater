import { ScafflaterError } from "../../errors";

export default class CannotGetSourceError extends ScafflaterError {
  constructor(sourceKey) {
    super(`Cannot get template source: ${sourceKey}.`);
    this.sourceKey = sourceKey;
  }
}
