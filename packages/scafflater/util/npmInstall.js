const { exec } = require("child_process");

/**
 * Executes npm install in a folder
 *
 * @param {string} packagePath - The path where npm install must be run
 * @returns {Promise<void>}
 */
function npmInstall(packagePath) {
  return new Promise((resolve, reject) => {
    exec("npm install", { cwd: packagePath }, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

module.exports = npmInstall;
