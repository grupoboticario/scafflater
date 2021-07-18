const os = require("os");
const path = require("path");
const OptionsProvider = require("../../options-provider");
const DirCache = require("./dir-cache");

/**
 * Stores templates in the local file system.
 * @extends DirCache
 */
class HomeDirCache extends DirCache {
  constructor(config = {}) {
    config = { ...new OptionsProvider(), ...config };
    super(path.join(os.homedir(), ".scafflater", "templates"), config);
  }
}

module.exports = HomeDirCache;
