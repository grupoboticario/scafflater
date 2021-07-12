const { RegionProvider } = require('../region-provider')
const Appender = require('./appender')
const ConfigProvider = require('../../config-provider')

class RegionAppender extends Appender {

  /** 
  * Process the input.
  * @param {Context} context The context of generation
  * @param {string} srcStr The string to be appended
  * @param {string} destStr The string where srcStr must be appended
  * @return {ProcessResult} The process result
  */
  append(context, srcStr, destStr) {
    return new Promise(async (resolve, reject) => {
      try {
        const regionProvider = new RegionProvider(context.config)
        let srcRegions = regionProvider.getRegions(srcStr)
        if (srcRegions.length <= 0) {
          resolve({
            context,
            result: destStr,
            notAppended: srcStr
          })
        }
        let srcRegion = srcRegions[0]

        while (srcRegion) {
          let destRegion = regionProvider.getRegions(destStr).find(r => r.name === srcRegion.name)
          let destContent = destRegion ? destRegion.content : ''

          const configFromFile = await ConfigProvider.extractConfigFromString(srcRegion.content, context.config)
          const _ctx = { ...context }
          _ctx.config = configFromFile.config
          destContent = (await super.append(_ctx, configFromFile.fileContent, destContent)).result

          if (destRegion) {
            destStr =
              destStr.substring(0, destRegion.startRegionTag.endPosition) +
              destContent +
              destStr.substring(destRegion.endRegionTag.startPosition)
          } else {
            destStr = await regionProvider.appendRegion(srcRegion, destStr)
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


        destStr = destStr.replace(/^(\s*\r?\n){2,}/gm, '\n')
        srcStr = srcStr.replace(/^(\s*\r?\n){2,}/gm, '\n').trim()

        resolve({
          context,
          result: destStr,
          notAppended: srcStr
        })
      } catch (e) {
        reject(e)
      }
    })
  }
}

module.exports = RegionAppender
