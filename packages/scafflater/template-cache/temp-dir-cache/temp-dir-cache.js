import ScafflaterOptions from "../../options";
import FileSystemUtils from "../../fs-util";
import DirCache from "../dir-cache/dir-cache";

/**
 * Stores templates in the local file system
 *
 * @augments DirCache
 */
export default class TempDirCache extends DirCache {
  constructor(config = {}) {
    config = { ...new ScafflaterOptions(), ...config };
    super(FileSystemUtils.getTempFolderSync(), config);
  }
}
