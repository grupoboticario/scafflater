const util = require('../../util')
const RegionTagType = {
  Unknown: 0,
  Start: 1,
  End: 2,
}

class RegionTag {
  constructor(name, start, end, type) {
    this.name = name
    this.regionTagType = type
    this.startPosition = start
    this.endPosition = end
  }

  static unknown() {
    return new RegionTag(RegionTagType.Unknown)
  }
}

class Region {
  get contentStart() {
    return this.startRegionTag.endPosition + 1
  }

  get contentEnd() {
    return this.endRegionTag === RegionTagType.unknown ? null : this.endRegionTag.startPosition - 1
  }

  get name() {
    if (this.startRegionTag && this.startRegionTag.name) {
      return this.startRegionTag.name
    }
    return ''
  }

  constructor(parentRegion, startRegionTag, endRegionTag = RegionTag.unknown(), content = null) {
    this.parentRegion = parentRegion
    this.startRegionTag = startRegionTag
    this.endRegionTag = endRegionTag
    this.content = content
  }
}

class RegionProvider {
  /**
  * Constructor
  * @param {ConfigProvider} ConfigProvider - The config provider
  */
  constructor(ConfigProvider) {
    this.configProvider = ConfigProvider
  }

  /**
  * Get regions from a string
  * @param {string} str - String to be analyzed
  * @return {Region[]} A list of regions
  */
  getRegions(str) {
    var completedRegions = []
    const regionRegex = new RegExp(`(?<start>.*${this.configProvider.startRegionMarker}) *(?<startName>.*)?.*$|(?<end>.*${this.configProvider.endRegionMarker}.*$)`, 'gim')
    const regionMarkers = str.matchAll(regionRegex)
    var startedRegions = []

    for (const rm of regionMarkers) {
      if (rm.groups.start) {
        var startRegionTag = new RegionTag(rm.groups.startName, rm.index, rm.index + rm[0].length, RegionTagType.Start)
        let parentRegion = null
        if (startedRegions.length > 0) {
          parentRegion = startedRegions[startedRegions.length - 1]
        }

        startedRegions.push(new Region(parentRegion, startRegionTag))
      } else if (rm.groups.end) {
        if (startedRegions.length === 0) {
          throw new Error(`Found an end region with no matching start tag at position ${rm.index}`)
        }
        var endTag = new RegionTag(null, rm.index, rm.index + rm[0].length, RegionTagType.end)

        var lastStartedRegion = startedRegions[startedRegions.length - 1]
        var content = str.substring(lastStartedRegion.startRegionTag.endPosition, endTag.startPosition)
        var finishedRegion = new Region(lastStartedRegion.parentRegion, lastStartedRegion.startRegionTag, endTag, content)

        completedRegions.filter(cr => cr.parentRegion && cr.parentRegion.name === finishedRegion.name).forEach(cr => cr.parentRegion = finishedRegion)

        completedRegions.push(finishedRegion)
        startedRegions.pop()
      }
    }

    if (startedRegions.length > 0) {
      let errors = ''
      for (let err of startedRegions) {
        errors += `Found a started region with no matching end tag at position ${err.startPosition}`
      }
      throw new Error(errors)
    }

    return completedRegions
  }

  /** 
  * Appends region to a content
  * @param {Region} region - The Region
  * @param {string} content - The Region Content
  * @return {Promise<string>} The content with the region appended
  */
  appendRegion(region, content) {
    return new Promise(async (resolve, reject) => {
      try {
        let regionStr = util.buildLineComment(this.configProvider, `${this.configProvider.startRegionMarker} ${region.name}`) + `\n` +
          `${region.content}\n` +
          util.buildLineComment(this.configProvider, this.configProvider.endRegionMarker) + `\n`

        if (region.parentRegion) {
          const p = new Region(
            region.parentRegion.parentRegion,
            region.parentRegion.startRegionTag,
            region.parentRegion.endRegionTag,
            regionStr
          )
          regionStr = await this.appendRegion(p, null)
        }

        resolve(content && content.length > 0 ? `${content}\n${regionStr}` : regionStr)
      } catch (error) {
        reject(error)
      }
    })
  }
}

module.exports = {
  RegionProvider,
  RegionTag,
  Region,
  RegionTagType,
}
