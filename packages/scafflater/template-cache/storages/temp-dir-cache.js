const OptionsProvider = require("../../options-provider");
const FileSystemUtils = require("../../fs-util");
const DirCache = require("./dir-cache");

/**
 * Stores templates in the local file system
 * @extends DirCache
 */
class TempDirCache extends DirCache {
  constructor(config = {}) {
    config = { ...new OptionsProvider(), ...config };
    super(FileSystemUtils.getTempFolderSync(), config);
  }
}

module.exports = TempDirCache;
