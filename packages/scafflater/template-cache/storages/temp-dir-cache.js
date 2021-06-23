const path = require('path')
const ConfigProvider = require('../../config-provider')
const FileSystemUtils = require('../../fs-util')
const DirCache = require('./dir-cache')

/**
* Stores templates in the local file system
* @extends DirCache
*/
class TempDirCache extends DirCache {
  constructor(config = {}) {
    config = {...new ConfigProvider(), ...config}
    super(FileSystemUtils.getTempFolder(), config)
  }
}

module.exports = TempDirCache
