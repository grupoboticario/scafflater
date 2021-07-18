const fs = require("fs-extra");
const os = require("os");
const dirTree = require("directory-tree");
const glob = require("glob");
const path = require("path");
const { EOL } = require("os");
const stripJsonComments = require("strip-json-comments");
const npmInstallExec = require("../util/npmInstall");

/**
 * Loads js
 * @param {string} jsPath
 * @returns {object} Loaded script
 */
fs.require = (jsPath) => {
  return require(jsPath);
};

/**
 * Looks for file uo.
 * @param {string} startPath - Path to start search
 * @param {string} fileName - File name to look for
 * @return {Promise<string>} The found file path
 */
fs.findFileUp = async (startPath, fileName) => {
  return new Promise(async (resolve, reject) => {
    const parts = path.dirname(startPath).split(path.sep);
    parts[0] = parts[0] === "" ? "/" : parts[0];
    while (parts.length > 0) {
      const tryPath = path.join(...parts, fileName);
      if (await fs.pathExists(tryPath)) {
        resolve(tryPath);
        return;
      }
      parts.pop();
    }
    reject(new Error("File not found"));
  });
};

fs.loadScriptsAsObjects = (folderPath, npmInstall = false) => {
  return new Promise(async (resolve, reject) => {
    try {
      const jsList = await fs.listJsScripts(folderPath, npmInstall);
      const result = {};

      for (const key in jsList) {
        if (jsList.hasOwnProperty(key)) {
          const js = jsList[key];
          result[js.jsName] = js.object;
        }
      }

      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * @typedef {Object} JsFile
 * @property {string} filePath - The js file path
 * @property {string} fileName - The js file name
 * @property {object} object - The object loaded with required
 * @property {string} jsName - The filename without extension (.js)
 */
/**
 * Lists js scripts in a folder name.
 * @param {string} folderPath - Folder to list scripts
 * @param {boolean} npmInstall - If true, will run 'npm install' in the parent package
 * @return {Promise<JsFile>} The loaded scripts details
 */
fs.listJsScripts = (folderPath, npmInstall = false) => {
  return new Promise(async (resolve, reject) => {
    if (!folderPath || !(await fs.pathExists(folderPath))) {
      resolve([]);
      return;
    }

    const jsList = await fs.listFilesByExtensionDeeply(folderPath, "js");
    if (!jsList) {
      resolve([]);
      return;
    }

    if (npmInstall) {
      npmInstallExec(folderPath);
    }

    const result = [];
    for (const js of jsList) {
      try {
        if (js.endsWith(".test.js")) continue;

        result.push({
          filePath: js,
          fileName: path.basename(js),
          object: fs.require(js),
          jsName: path.basename(js, ".js"),
        });
      } catch (error) {
        reject(error);
        return;
      }
    }

    resolve(result);
  });
};

/**
 * Returns a temp folder path
 * @returns {string} A temp folder path
 * @returns {Promise<string>} The temp path
 */
fs.getTempFolder = async () => {
  return fs.mkdtemp(os.tmpdir());
};

/**
 * Returns a temp folder path
 * @returns {string} A temp folder path
 * @returns {string} The temp path
 */
fs.getTempFolderSync = () => {
  return fs.mkdtempSync(os.tmpdir());
};

/**
 * Copies folder and files, creating the dest folder if it does not exists.
 * @param {string} src - Source
 * @param {string} dest - Destiny
 * @returns {Promise}
 */
fs.copyEnsuringDest = async (src, dest) => {
  await fs.ensureDir(dest);
  return fs.copy(src, dest);
};

/**
 * Gets file
 * @param {string} filePath - Source
 * @returns {string} The read file content
 * @returns {Promise<string>} The File content
 */
fs.readFileContent = async (filePath) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!(await fs.exists(filePath))) {
        resolve(null);
      }
      resolve((await fs.readFile(filePath)).toString());
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Reads an Json file
 * @param {string} filePath - Source
 * @returns {Promise<object>} The Json object
 */
fs.readJSON = async (filePath) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!(await fs.exists(filePath))) {
        resolve(null);
      }
      const content = (await fs.readFile(filePath)).toString();

      resolve(JSON.parse(stripJsonComments(content)));
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Reads an Json file
 * @param {string} filePath - Source
 * @param {string} filePath - Source
 * @returns {Promise<object>} The Json object
 */
fs.writeJSON = async (filePath, obj, indent = true) => {
  return fs.writeFile(filePath, JSON.stringify(obj, null, indent ? 2 : null));
};

/**
 * Saves the file, ensuring that destiny folder exists and formatting text if it is an append operation.
 * @param {string} filePath - Source
 * @param {string} data - Data to be saved
 * @param {boolean} append - Appends data in file. The file is created if does not exists. Default = true
 * @returns {Promise}
 */
fs.saveFile = async (filePath, data, append = true) => {
  const option = { flag: "w" };
  if ((await fs.exists(filePath)) && append) {
    data = EOL + EOL + data;
    option.flag = "a";
  }
  await fs.ensureDir(path.dirname(filePath));
  return fs.writeFile(filePath, data, option);
};

/**
 * Returns the directory tree
 * @param {string} folderPath - The path to build the tree
 * @param {boolean} includeFiles - If true, the files will be included in the list
 * @return {Promise<object>} The tree
 */
fs.getDirTreeSync = (folderPath, includeFiles = true) => {
  const options = {};
  if (!includeFiles) {
    // Regex thar does not match with nothing
    options.extensions = /ˆ.*/;
  }
  return dirTree(folderPath, options);
};

/**
 * List files in directory tree
 * @param {string} folderPath - Path to look for files
 * @param {string} filePattern - Glob pattern to filter files
 * @return {Promise<string[]>} List of file names
 */
fs.listFilesDeeply = async (folderPath, filePattern) => {
  return new Promise((resolve, reject) => {
    glob(filePattern, { root: folderPath }, (err, files) => {
      if (err) reject(err);
      if (!files || files.length <= 0) resolve(null);
      resolve(files);
    });
  });
};

/**
 * List files in directory tree by extension
 * @param {string} folderPath - Path to look for files
 * @param {string} extension - Glob pattern to filter files
 * @return {Promise<string[]>} List of file names
 */
fs.listFilesByExtensionDeeply = async (folderPath, extension) => {
  return fs.listFilesDeeply(folderPath, `/**/*.${extension}`);
};

/**
 * List files in directory tree by name
 * @param {string} folderPath - Path to look for files
 * @param {string} fileName - Glob pattern to filter files
 * @return {Promise<string[]>} List of file names
 */
fs.listFilesByNameDeeply = async (folderPath, fileName) => {
  return fs.listFilesDeeply(folderPath, `/**/${fileName}`);
};

module.exports = fs;
