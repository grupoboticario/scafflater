import ScafflaterOptions from "../../options/index.js";
import FileSystemUtils from "../../fs-util/index.js";
import DirCache from "../dir-cache/dir-cache.js";

/**
 * Stores templates in the local file system
 * @augments DirCache
 */
export default class TempDirCache extends DirCache {
  constructor(config = {}) {
    config = { ...new ScafflaterOptions(), ...config };
    super(FileSystemUtils.getTempFolderSync(), config);
  }
}
