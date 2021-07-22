const OptionsProvider = require("../../options");
const FileSystemUtils = require("../../fs-util");
const DirCache = require("../dir-cache/dir-cache");

/**
 * Stores templates in the local file system
 *
 * @augments DirCache
 */
class TempDirCache extends DirCache {
  constructor(config = {}) {
    config = { ...new OptionsProvider(), ...config };
    super(FileSystemUtils.getTempFolderSync(), config);
  }
}

module.exports = TempDirCache;
