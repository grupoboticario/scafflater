const fsUtil = require('../fs-util')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs-extra')

/**
* Class to manage Github Repos
*/
class GitUtil {
  /**
  * Clones a repo to a local path.
  * @param {string} repo - Repository (<owner>/<repository>)
  * @param {string} localPath - Local path where the repos will be cloned
  * @param {string} [baseGitHubUrl] - Github base path
  * @returns {Promise} The command messages
  */
  static clone(repo, localPath, username = null, password = null) {
    const headers = {}

    if (username && password) {
      const t = `${username}:${password}`
      headers.Authentication = `Basic ${Buffer.from(t).toString('base64')}`
    }

    console.log(headers)

    return git.clone({
      fs,
      http,
      url: repo,
      dir: localPath,
      singleBranch: true,
      depth: 1,
      headers
    });
  }

  /**
  * Clones a repo to a temp path.
  * @param {string} repo - Repository (<owner>/<repository>)
  * @returns {Promise<string>} The path where repo was cloned
  */
  static async cloneToTempPath(repo, username = null, password = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const tempDir = await fsUtil.getTempFolder()
        await this.clone(repo, tempDir)
        resolve(tempDir)
      } catch (error) {
        reject(error)
      }
    })
  }
}

module.exports = GitUtil
