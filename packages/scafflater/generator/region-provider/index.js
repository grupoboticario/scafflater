import ScafflaterOptions from "../../options";
import { buildLineComment } from "../../util";
export const RegionTagType = {
  Unknown: 0,
  Start: 1,
  End: 2,
};

export class RegionTag {
  constructor(name, start, end, type) {
    this.name = name;
    this.regionTagType = type;
    this.startPosition = start;
    this.endPosition = end;
  }

  static unknown() {
    return new RegionTag(RegionTagType.Unknown);
  }
}

export class Region {
  get contentStart() {
    return this.startRegionTag.endPosition + 1;
  }

  get contentEnd() {
    return this.endRegionTag === RegionTagType.unknown
      ? null
      : this.endRegionTag.startPosition - 1;
  }

  get name() {
    if (this.startRegionTag && this.startRegionTag.name) {
      return this.startRegionTag.name;
    }
    return "";
  }

  constructor(
    parentRegion,
    startRegionTag,
    endRegionTag = RegionTag.unknown(),
    content = null
  ) {
    this.parentRegion = parentRegion;
    this.startRegionTag = startRegionTag;
    this.endRegionTag = endRegionTag;
    this.content = content;
  }
}

export class RegionProvider {
  /**
   * Constructor
   *
   * @param {ScafflaterOptions} options - Scafflater Options
   */
  constructor(options) {
    this.options = options;
  }

  /**
   * Get regions from a string
   *
   * @param {string} str - String to be analyzed
   * @returns {Region[]} A list of regions
   */
  getRegions(str) {
    const completedRegions = [];
    const regionRegex = new RegExp(
      `(?<start>.*${this.options.startRegionMarker}) *(?<startName>[^\\s]*)?.*$|(?<end>.*${this.options.endRegionMarker}.*$)`,
      "gim"
    );
    const regionMarkers = str.matchAll(regionRegex);
    const startedRegions = [];

    for (const rm of regionMarkers) {
      if (rm.groups.start) {
        const startRegionTag = new RegionTag(
          rm.groups.startName,
          rm.index,
          rm.index + rm[0].length,
          RegionTagType.Start
        );
        let parentRegion = null;
        if (startedRegions.length > 0) {
          parentRegion = startedRegions[startedRegions.length - 1];
        }

        startedRegions.push(new Region(parentRegion, startRegionTag));
      } else if (rm.groups.end) {
        if (startedRegions.length === 0) {
          throw new Error(
            `Found an end region with no matching start tag at position ${rm.index}`
          );
        }
        const endTag = new RegionTag(
          null,
          rm.index,
          rm.index + rm[0].length,
          RegionTagType.end
        );

        const lastStartedRegion = startedRegions[startedRegions.length - 1];
        const content = str.substring(
          lastStartedRegion.startRegionTag.endPosition,
          endTag.startPosition
        );
        const finishedRegion = new Region(
          lastStartedRegion.parentRegion,
          lastStartedRegion.startRegionTag,
          endTag,
          content
        );

        completedRegions
          .filter(
            (cr) =>
              cr.parentRegion && cr.parentRegion.name === finishedRegion.name
          )
          .forEach((cr) => (cr.parentRegion = finishedRegion));

        completedRegions.push(finishedRegion);
        startedRegions.pop();
      }
    }

    if (startedRegions.length > 0) {
      let errors = "";
      for (const err of startedRegions) {
        errors += `Found a started region with no matching end tag at position ${err.startPosition}`;
      }
      throw new Error(errors);
    }

    return completedRegions;
  }

  /**
   * Appends region to a content
   *
   * @param {Region} region - The Region
   * @param {string} content - The Region Content
   * @returns {Promise<string>} The content with the region appended
   */
  async appendRegion(region, content) {
    let regionStr =
      buildLineComment(
        this.options,
        `${this.options.startRegionMarker} ${region.name}`
      ) +
      `\n` +
      `${region.content}\n` +
      buildLineComment(this.options, this.options.endRegionMarker) +
      `\n`;

    if (region.parentRegion) {
      const p = new Region(
        region.parentRegion.parentRegion,
        region.parentRegion.startRegionTag,
        region.parentRegion.endRegionTag,
        regionStr
      );
      regionStr = await this.appendRegion(p, null);
    }

    return Promise.resolve(
      content && content.length > 0 ? `${content}\n${regionStr}` : regionStr
    );
  }
}
