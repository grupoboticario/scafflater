const os = require("os");
const path = require("path");
const { ScafflaterOptions } = require("../../options");
const DirCache = require("../dir-cache");

/**
 * Stores templates in the local file system.
 *
 * @augments DirCache
 */
class HomeDirCache extends DirCache {
  constructor(config = {}) {
    config = { ...new ScafflaterOptions(), ...config };
    super(path.join(os.homedir(), ".scafflater", "templates"), config);
  }
}

module.exports = HomeDirCache;
