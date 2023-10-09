import { ScafflaterError } from "../../errors/index.js";

export default class CannotGetSourceError extends ScafflaterError {
  constructor(sourceKey) {
    super(`Cannot get template source: ${sourceKey}.`);
    this.sourceKey = sourceKey;
  }
}
