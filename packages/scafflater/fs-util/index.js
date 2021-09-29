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
 *
 * @param {string} jsPath The js path to load
 * @returns {object} Loaded script
 */
fs.require = (jsPath) => {
  return require(jsPath);
};

/**
 * Looks for file uo.
 *
 * @param {string} startPath - Path to start search
 * @param {string} fileName - File name to look for
 * @returns {Promise<string>} The found file path
 */
fs.findFileUp = async (startPath, fileName) => {
  const parts = path.dirname(startPath).split(path.sep);
  parts[0] = parts[0] === "" ? "/" : parts[0];
  while (parts.length > 0) {
    const tryPath = path.join(...parts, fileName);
    if (await fs.pathExists(tryPath)) {
      return Promise.resolve(tryPath);
    }
    parts.pop();
  }
  return Promise.reject(new Error("File not found"));
};

fs.loadScriptsAsObjects = async (folderPath, npmInstall = false) => {
  if (npmInstall) {
    await npmInstallExec(folderPath);
  }

  return require(folderPath);
};

/**
 * @typedef {object} JsFile
 * @property {string} filePath - The js file path
 * @property {string} fileName - The js file name
 * @property {object} object - The object loaded with required
 * @property {string} jsName - The filename without extension (.js)
 */
/**
 * Lists js scripts in a folder name.
 *
 * @param {string} folderPath - Folder to list scripts
 * @param {boolean} npmInstall - If true, will run 'npm install' in the parent package
 * @returns {Promise<JsFile>} The loaded scripts details
 */
fs.listJsScripts = async (folderPath, npmInstall = false) => {
  if (!folderPath || !(await fs.pathExists(folderPath))) {
    return Promise.resolve([]);
  }

  const jsList = await fs.listFilesDeeply(folderPath, "/*.js");
  if (!jsList) {
    return Promise.resolve([]);
  }

  if (npmInstall) {
    await npmInstallExec(folderPath);
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
      return Promise.reject(error);
    }
  }

  return Promise.resolve(result);
};

/**
 * Returns a temp folder path
 *
 * @returns {Promise<string>} The temp path
 */
fs.getTempFolder = async () => {
  return fs.mkdtemp(os.tmpdir());
};

/**
 * Returns a temp folder path
 *
 * @returns {Promise<string>} The temp path
 */
fs.getTempFolderSync = () => {
  return fs.mkdtempSync(os.tmpdir());
};

/**
 * Copies folder and files, creating the dest folder if it does not exists.
 *
 * @param {string} src - Source
 * @param {string} dest - Destiny
 * @returns {Promise<void>}
 */
fs.copyEnsuringDest = async (src, dest) => {
  await fs.ensureDir(dest);
  return fs.copy(src, dest);
};

/**
 * Gets file
 *
 * @param {string} filePath - Source
 * @returns {Promise<string>} The File content
 */
fs.readFileContent = async (filePath) => {
  if (!(await fs.pathExists(filePath))) {
    return Promise.resolve(null);
  }
  return Promise.resolve((await fs.readFile(filePath)).toString());
};

/**
 * Reads an Json file
 *
 * @param {string} filePath - Source
 * @returns {Promise<object>} The Json object
 */
fs.readJSON = async (filePath) => {
  if (!(await fs.pathExists(filePath))) {
    return Promise.resolve(null);
  }
  const content = (await fs.readFile(filePath)).toString();

  return Promise.resolve(JSON.parse(stripJsonComments(content)));
};

/**
 * Writes an Json file
 *
 * @param {string} filePath - Source
 * @param {object} obj Object to save
 * @param {boolean} indent True, if the file should be saved indented
 * @returns {Promise<object>} The Json object
 */
fs.writeJSON = async (filePath, obj, indent = true) => {
  return fs.writeFile(filePath, JSON.stringify(obj, null, indent ? 2 : null));
};

/**
 * Saves the file, ensuring that destiny folder exists and formatting text if it is an append operation.
 *
 * @param {string} filePath - Source
 * @param {string} data - Data to be saved
 * @param {boolean} append - Appends data in file. The file is created if does not exists. Default = true
 * @returns {Promise<void>}
 */
fs.saveFile = async (filePath, data, append = true) => {
  const option = { flag: "w" };
  if ((await fs.pathExists(filePath)) && append) {
    data = EOL + EOL + data;
    option.flag = "a";
  }
  await fs.ensureDir(path.dirname(filePath));
  return fs.writeFile(filePath, data, option);
};

/**
 * Returns the directory tree
 *
 * @param {string} folderPath - The path to build the tree
 * @param {boolean} includeFiles - If true, the files will be included in the list
 * @returns {Promise<object>} The tree
 */
fs.getDirTreeSync = (folderPath, includeFiles = true) => {
  const options = {
    attributes: ["type"],
    normalizePath: true,
  };
  if (!includeFiles) {
    // Regex thar does not match with nothing
    options.extensions = /ˆ.*/;
  }
  return dirTree(folderPath, options);
};

/**
 * List files in directory tree
 *
 * @param {string} folderPath - Path to look for files
 * @param {string} filePattern - Glob pattern to filter files
 * @returns {Promise<string[]>} List of file names
 */
fs.listFilesDeeply = async (folderPath, filePattern) => {
  return new Promise((resolve, reject) => {
    try {
      glob(filePattern, { root: folderPath }, (err, files) => {
        if (err) reject(err);
        if (!files || files.length <= 0) resolve(null);
        resolve(files);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * List files in directory tree by extension
 *
 * @param {string} folderPath - Path to look for files
 * @param {string} extension - Glob pattern to filter files
 * @returns {Promise<string[]>} List of file names
 */
fs.listFilesByExtensionDeeply = async (folderPath, extension) => {
  return fs.listFilesDeeply(folderPath, `/**/*.${extension}`);
};

/**
 * List files in directory tree by name
 *
 * @param {string} folderPath - Path to look for files
 * @param {string} fileName - Glob pattern to filter files
 * @returns {Promise<string[]>} List of file names
 */
fs.listFilesByNameDeeply = async (folderPath, fileName) => {
  return fs.listFilesDeeply(folderPath, `/**/${fileName}`);
};

module.exports = fs;
