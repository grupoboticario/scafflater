
const defaultConfig = {
  configManager: 'local',
  configManagers: {
    local: './local-config-manager',
  },
}

/**
* ConfigManager factory.
*/
class ConfigManager {
  /**
  * Config Manager constructor.
  * @param {?object} config - Scafflater configuration. If null, will get the default configuration.
  */
  constructor(config = {}) {
    this.config = {...defaultConfig, ...config}
  }

  /**
  * Returns the template source instance to be used to get templates.
  * @param {?string} configManager - Config Manager to be used. If null, will use local as default.
  * @return {ConfigManager} An specialized instance of TemplateStorage.
  */
  getConfigManager(configManager = null) {
    const c = configManager ? configManager : this.config.configManager

    if (!this.config.configManagers[c]) {
      throw new Error(`There's no module for config manager '${c}'`)
    }

    return new (require(this.config.configManagers[c]))(this.config)
  }

  /**
  * Gets config.
  */
  async getConfig() {
    return this
    .getConfigManager()
    .getConfig()
  }

  /**
  * Saves config.
  */
  async saveConfig() {
    this
    .getConfigManager()
    .saveConfig()
  }
}

module.exports = ConfigManager
