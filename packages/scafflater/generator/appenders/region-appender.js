const { RegionProvider } = require('../region-provider/region-provider')
const Appender = require('./appender')

class RegionAppender extends Appender {
  
  /** 
  * Process the input.
  * @param {Context} context The context of generation
  * @param {string} srcStr The string to be appended
  * @param {string} destStr The string where srcStr must be appended
  * @return {ProccessResult} The process result
  */
  append(context, srcStr, destStr) {

    const regionProvider = new RegionProvider(context.config)
    let srcRegions = regionProvider.getRegions(srcStr)
    if (srcRegions.length <= 0) {
      return {
        context,
        result: destStr,
        notAppended: srcStr
      }
    }
    let srcRegion = srcRegions[0]

    while(srcRegion) {
      let destRegion = regionProvider.getRegions(destStr).find(r => r.name === srcRegion.name)
      let destContent = destRegion ? destRegion.content : ''

      destContent = super.append(context, srcRegion.content, destContent).result

      if (destRegion) {
        destStr = 
          destStr.substring(0, destRegion.startRegionTag.endPosition) + 
          destContent + 
          destStr.substring(destRegion.endRegionTag.startPosition)
      }else{
        var t = regionProvider.appendRegion(srcRegion, destContent)
        destStr = regionProvider.appendRegion(srcRegion, destStr)
      }

      // Removing region from srcStr, since it was appended
      srcStr = 
        srcStr.substring(0, srcRegion.startRegionTag.startPosition) + 
        srcStr.substring(srcRegion.endRegionTag.endPosition)
      srcRegions = regionProvider.getRegions(srcStr)
      if (srcRegions.length <= 0) {
        break
      }
      srcRegion = srcRegions[0]
    }


    destStr = destStr.replace(/^(\s*\r?\n){2,}/gm,'\n')
    srcStr = srcStr.replace(/^(\s*\r?\n){2,}/gm,'\n').trim()

    return {
      context,
      result: destStr,
      notAppended: srcStr
    }
  }
}

module.exports = RegionAppender
