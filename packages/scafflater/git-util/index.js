const fsUtil = require("../fs-util");
const git = require("isomorphic-git");
const http = require("isomorphic-git/http/node");
const fs = require("fs-extra");
const { spawn } = require("child_process");
const { URL } = require("url");

/**
 * Class to manage Github Repos
 */
class GitUtil {
  /**
   * Clones a repo to a local path.
   *
   * @param {string} repo - Repository (<owner>/<repository>)
   * @param {string} localPath - Local path where the repos will be cloned
   * @param {string} username The github user
   * @param {string} password The github password
   * @returns {Promise} The command messages
   */
  static async clone(repo, localPath, username = null, password = null) {
    const headers = {};

    if (username && password) {
      const t = `${username}:${password}`;
      headers.Authorization = `Basic ${Buffer.from(t).toString("base64")}`;
    }

    try {
      return await git.clone({
        fs,
        http,
        url: repo,
        dir: localPath,
        singleBranch: true,
        depth: 1,
        headers,
        onAuth: this.onAuth,
      });
    } catch (error) {
      throw new Error(
        `Clone failed: ${error} (Authorization Header: '${headers.Authorization}')`
      );
    }
  }

  static async onAuth(url) {
    const { protocol, host } = new URL(url);
    return new Promise((resolve, reject) => {
      const output = [];
      const process = spawn("git", ["credential", "fill"]);
      process.on("close", (code) => {
        if (code) return reject(code);
        const { username, password } = output
          .join("\n")
          .split("\n")
          .reduce((acc, line) => {
            if (line.startsWith("username") || line.startsWith("password")) {
              const [key, val] = line.split("=");
              acc[key] = val;
            }
            return acc;
          }, {});
        resolve({ username, password });
      });
      process.stdout.on("data", (data) => output.push(data.toString().trim()));
      process.stdin.write(
        `protocol=${protocol.slice(0, -1)}\nhost=${host}\n\n`
      );
    });
  }

  /**
   * Clones a repo to a temp path.
   *
   * @param {string} repo - Repository (<owner>/<repository>)
   * @param {string} username The github user
   * @param {string} password The github password
   * @returns {Promise<string>} The path where repo was cloned
   */
  static async cloneToTempPath(repo, username = null, password = null) {
    const tempDir = await fsUtil.getTempFolder();
    await this.clone(repo, tempDir);
    return Promise.resolve(tempDir);
  }
}

module.exports = GitUtil;
