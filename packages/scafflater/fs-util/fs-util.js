const fs = require('fs-extra')
const os = require('os')
const dirTree = require('directory-tree')
const glob = require('glob')
const path = require('path')
const {EOL} = require('os')

class FileSystemUtils {
  /**
  * Returns a temp folder path
  * @returns {string} A temp folder path
  */
  static getTempFolder() {
    return fs.mkdtempSync(os.tmpdir())
  }

  /**
  * Checks if a path exists
  * @param {string} path - Path to be tested
  * @returns {boolean} True if the path exists
  */
  static pathExists(path) {
    return fs.pathExistsSync(path)
  }

  /**
  * Copies folder and files.
  * @param {string} src - Source
  * @param {string} dest - Destin
  */
  static copy(src, dest) {
    fs.ensureDirSync(dest)
    fs.copySync(src, dest)
  }

  /**
  * Gets json file
  * @param {string} path - Source
  * @returns {object} The read json
  */
  static getJson(path) {
    return fs.readJsonSync(path)
  }

  /**
  * Gets file
  * @param {string} path - Source
  * @returns {object} The read file
  */
  static getFile(path) {
    return fs.readFileSync(path).toString()
  }

  /**
  * Gets file
  * @param {string} filePath - Source
  * @param {string} data - Data to be saved
  * @param {boolean} append - Appends data in file. The file is created if does not exists. Default = true
  */
  static saveFile(filePath, data, append = true) {
    const option = {flag: 'w'}
    if (fs.existsSync(filePath) && append) {
      data = EOL + EOL + data
      option.flag = 'a'
    }
    fs.ensureDirSync(path.dirname(filePath))
    fs.writeFileSync(filePath, data, option)
  }

  /**
  * Saves json file
  * @param {string} path - Source
  * @param {object} object - The object to be saved
  */
  static saveJson(path, object) {
    fs.writeJsonSync(path, object, {spaces: ' '})
  }

  /**
  * Returns the directory tree
  * @param {string} path - The path to build the tree
  * @param {boolean} includeFiles - If true, the files will be included in the list
  * @return {object} The tree
  */
  static getDirTree(path, includeFiles = true) {
    const options = {}
    if (!includeFiles) {
      // Regex thar does not match with nothing
      options.extensions = /ˆ.*/
    }
    return dirTree(path, options)
  }

  /**
  * List all scafflater in a directory tree.
  * @param {string} path - Path to look for scafflater templates
  * @return {ReturnValueDataTypeHere} Brief description of the returning value here.
  */
  static async listScfConfigTreeInPath(path) {
    return new Promise((resolve, reject) => {
      glob('/**/_scf.json', {root: path}, (err, files) => {
        if (err)
          reject(err)
        if (!files || files.length <= 0)
          resolve(null)
        resolve(files)
      })
    })
  }

  /**
  * List all javascript files in a directory tree.
  * @param {string} path - Path to look for scafflater templates
  * @return {ReturnValueDataTypeHere} Brief description of the returning value here.
  */
  static async listJsTreeInPath(path) {
    return new Promise((resolve, reject) => {
      glob('/**/*.js', {root: path}, (err, files) => {
        if (err)
          reject(err)
        if (!files || files.length <= 0)
          resolve(null)
        resolve(files)
      })
    })
  }
}

module.exports = FileSystemUtils
