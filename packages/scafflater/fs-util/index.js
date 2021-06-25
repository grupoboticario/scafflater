const fs = require('fs-extra')
const os = require('os')
const dirTree = require('directory-tree')
const glob = require('glob')
const path = require('path')
const { EOL } = require('os')

/**
* Returns a temp folder path
* @returns {string} A temp folder path
* @returns {Promise<string>} The temp path
*/
fs.getTempFolder = async () => {
  return fs.mkdtemp(os.tmpdir())
}

/**
* Returns a temp folder path
* @returns {string} A temp folder path
* @returns {string} The temp path
*/
fs.getTempFolderSync = () => {
  return fs.mkdtempSync(os.tmpdir())
}

/**
* Copies folder and files, creating the dest folder if it does not exists.
* @param {string} src - Source
* @param {string} dest - Destiny
* @returns {Promise}
*/
fs.copyEnsuringDest = async (src, dest) => {
  await fs.ensureDir(dest)
  return fs.copy(src, dest)
}

/**
* Gets file
* @param {string} filePath - Source
* @returns {string} The read file content
* @returns {Promise<string>} The File content
*/
fs.readFileContent = async (filePath) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!await fs.exists(filePath)) {
        resolve(null)
      }
      resolve((await fs.readFile(filePath)).toString())
    } catch (error) {
      reject(error)
    }
  })
}

/**
* Saves the file, ensuring that destiny folder exists and formatting text if it is an append operation.
* @param {string} filePath - Source
* @param {string} data - Data to be saved
* @param {boolean} append - Appends data in file. The file is created if does not exists. Default = true
* @returns {Promise}
*/
fs.saveFile = async (filePath, data, append = true) => {
  const option = { flag: 'w' }
  if (await fs.exists(filePath) && append) {
    data = EOL + EOL + data
    option.flag = 'a'
  }
  await fs.ensureDir(path.dirname(filePath))
  return fs.writeFile(filePath, data, option)
}

/**
* Returns the directory tree
* @param {string} folderPath - The path to build the tree
* @param {boolean} includeFiles - If true, the files will be included in the list
* @return {Promise<object>} The tree
*/
fs.getDirTreeSync = (folderPath, includeFiles = true) => {
  const options = {}
  if (!includeFiles) {
    // Regex thar does not match with nothing
    options.extensions = /ˆ.*/
  }
  return dirTree(folderPath, options)
}

/**
* List files in directory tree
* @param {string} folderPath - Path to look for files
* @param {string} filePattern - Glob pattern to filter files
* @return {Promise<string[]>} List of file names
*/
fs.listFilesDeeply = async (folderPath, filePattern) => {
  return new Promise((resolve, reject) => {
    glob(filePattern, { root: folderPath }, (err, files) => {
      if (err)
        reject(err)
      if (!files || files.length <= 0)
        resolve(null)
      resolve(files)
    })
  })
}

/**
* List files in directory tree by extension
* @param {string} folderPath - Path to look for files
* @param {string} extension - Glob pattern to filter files
* @return {Promise<string[]>} List of file names
*/
fs.listFilesByExtensionDeeply = async (folderPath, extension) => {
  return fs.listFilesDeeply(folderPath, `/**/*.${extension}`)
}

/**
* List files in directory tree by name
* @param {string} folderPath - Path to look for files
* @param {string} fileName - Glob pattern to filter files
* @return {Promise<string[]>} List of file names
*/
fs.listFilesByNameDeeply = async (folderPath, fileName) => {
  return fs.listFilesDeeply(folderPath, `/**/${fileName}`)
}

module.exports = fs
