/* eslint-disable no-undef */
const ConfigManager = require('./config-manager')
const LocalConfigManager = require('./local-config-manager')

test('Throws an exception when the storage does not exists', () => {
  // ARRANJE
  const config = {configManager: 'bla'}
  const cm = new ConfigManager(config)

  // ACT and ASSERT
  expect(() => {
    cm.getConfigManager()
  }).toThrowError("There's no module for config manager 'bla'")
})

test('Gets the template storage in config', () => {
  // ARRANJE
  const config = {storage: 'local'}
  const cm = new ConfigManager(config)

  // ACT
  const result = cm.getConfigManager()

  // ASSERT
  // eslint-disable-next-line no-proto
  expect(result.__proto__ instanceof ConfigManager).toBe(true)
  expect(result instanceof LocalConfigManager).toBe(true)
})
