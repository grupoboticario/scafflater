import { exec } from "child_process";

/**
 * Executes npm install in a folder
 * @param {string} packagePath - The path where npm install must be run
 * @returns {Promise<void>}
 */
export default function npmInstall(packagePath) {
  return new Promise((resolve, reject) => {
    try {
      exec("npm install", { cwd: packagePath }, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
