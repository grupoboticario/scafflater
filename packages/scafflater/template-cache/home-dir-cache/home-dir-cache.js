const os = require("os");
const path = require("path");
const OptionsProvider = require("../../options");
const DirCache = require("../dir-cache");

/**
 * Stores templates in the local file system.
 *
 * @augments DirCache
 */
class HomeDirCache extends DirCache {
  constructor(config = {}) {
    config = { ...new OptionsProvider(), ...config };
    super(path.join(os.homedir(), ".scafflater", "templates"), config);
  }
}

module.exports = HomeDirCache;
