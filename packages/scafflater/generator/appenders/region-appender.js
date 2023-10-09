import { RegionProvider } from "../region-provider/index.js";
import Appender from "./appender.js";

export default class RegionAppender extends Appender {
  /**
   * Process the input.
   *
   * @param {object} context The context of generation
   * @param {string} srcStr The string to be appended
   * @param {string} destStr The string where srcStr must be appended
   * @returns {Promise<object>} The process result
   */
  async append(context, srcStr, destStr) {
    const regionProvider = new RegionProvider(context.options);
    let srcRegions = regionProvider.getRegions(srcStr);
    if (srcRegions.length <= 0) {
      return Promise.resolve({
        context,
        result: destStr,
        notAppended: srcStr,
      });
    }
    let srcRegion = srcRegions[0];

    while (srcRegion) {
      const destRegion = regionProvider
        .getRegions(destStr)
        .find((r) => r.name === srcRegion.name);
      let destContent = destRegion ? destRegion.content : "";

      const options = context.options.getConfigFromString(srcRegion.content);
      const _ctx = {
        ...context,
        options,
      };
      destContent = (await super.append(_ctx, srcRegion.content, destContent))
        .result;

      if (destRegion) {
        destStr =
          destStr.substring(0, destRegion.startRegionTag.endPosition) +
          destContent +
          destStr.substring(destRegion.endRegionTag.startPosition);
      } else {
        destStr = await regionProvider.appendRegion(srcRegion, destStr);
      }

      // Removing region from srcStr, since it was appended
      srcStr =
        srcStr.substring(0, srcRegion.startRegionTag.startPosition) +
        srcStr.substring(srcRegion.endRegionTag.endPosition);
      srcRegions = regionProvider.getRegions(srcStr);
      if (srcRegions.length <= 0) {
        break;
      }
      srcRegion = srcRegions[0];
    }

    destStr = destStr.replace(/^(\s*\r?\n){2,}/gm, "\n");
    srcStr = srcStr.replace(/^(\s*\r?\n){2,}/gm, "\n").trim();

    return Promise.resolve({
      context,
      result: destStr,
      notAppended: srcStr,
    });
  }
}
