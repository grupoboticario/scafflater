const ConfigManager = require('./config-manager')
const os = require('os')
const path = require('path')
const FileSystemUtils = require('fs-util')

const defaultConfig = {
  localStorageConfigFile: path.join(os.homedir(), '.scafflater', 'scf.json'),
}

class LocalConfigManager extends ConfigManager {
  constructor(config = {}) {
    super(config)
    this.config = {...defaultConfig, ...config}
  }

  /**
  * Gets config.
  */
  async getConfig() {
    if (!FileSystemUtils.pathExists(this.config.localStorageConfigFile)) {
      this.initConfig()
    }
    return FileSystemUtils.getJson(this.config.localStorageConfigFile)
  }

  /**
  * Saves config.
  * @param {object} config - The config object to be saved
  */
  async saveConfig(config) {
    FileSystemUtils.saveJson(this.config.localStorageConfigFile, config)
  }

  /**
  * Initialize config. Will run when cli is executed for the first time
  */
  async initConfig() {
    await this.saveConfig(this.getDefaultConfig())
  }

  /**
  * Builds scaffolder cli default config
  * @returns {object} The defult scaffolder cli default config
  */
  getDefaultConfig() {
    return {
      templateInUse: null,
    }
  }
}

module.exports = LocalConfigManager
