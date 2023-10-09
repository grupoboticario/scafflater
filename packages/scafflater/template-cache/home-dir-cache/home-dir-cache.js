import os from "os";
import path from "path";
import ScafflaterOptions from "../../options/index.js";
import DirCache from "../dir-cache/dir-cache.js";

/**
 * Stores templates in the local file system.
 *
 * @augments DirCache
 */
export default class HomeDirCache extends DirCache {
  constructor(config = {}) {
    config = { ...new ScafflaterOptions(), ...config };
    super(path.join(os.homedir(), ".scafflater", "templates"), config);
  }
}
