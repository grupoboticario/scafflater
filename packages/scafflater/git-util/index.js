const {runCommand} = require('./utils')
const fsUtil = require('../fs-util')
const os = require('os')

/**
* Class to manage Github Repos
*/
class GitUtil {
  /**
  * Clones a repo to a local path.
  * @param {string} repo - Repository (<owner>/<repository>)
  * @param {string} localPath - Local path where the repos will be cloned
  * @param {string} [baseGitHubUrl] - Github base path
  */
  static clone(repo, localPath) {
    return runCommand('git',
      [
        'clone',
        repo,
        localPath,
      ]
    )
  } 

  /**
  * Clones a repo to a temp path.
  * @param {string} repo - Repository (<owner>/<repository>)
  * @returns {string} The path where repo was cloned
  */
  static async cloneToTempPath(repo) {
    const tempDir = await fsUtil.getTempFolder()
    await this.clone(repo, tempDir)

    return tempDir
  }
}

module.exports = GitUtil
