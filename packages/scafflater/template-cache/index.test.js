/* eslint-disable no-undef */
const path = require('path')
const TemplateCache = require('./')
const LocalTemplateCache = require('./storages/home-dir-cache')

test('Throws an exception when the storage does not exists', () => {
  // ARRANGE
  const config = {cacheStorage: 'bla'}

  // ACT and ASSERT
  expect(() => {
    TemplateCache.getTemplateCache(config)
  }).toThrowError("There's no module for source 'bla'")
})

test('Gets the template storage in config', () => {
  // ARRANGE
  const config = {cacheStorage: 'homeDir'}

  // ACT
  const result = TemplateCache.getTemplateCache(config)

  // ASSERT
  // eslint-disable-next-line no-proto
  expect(result.__proto__ instanceof TemplateCache).toBe(true)
  expect(result instanceof LocalTemplateCache).toBe(true)
})

test('Specialized call', () => {
  // ARRANGE
  // eslint-disable-next-line node/no-missing-require
  const mockedCache = new (require('mockedCache'))()
  const config = {
    cacheStorage: 'mockedCache',
    cacheStorages: {
      mockedCache: path.resolve(__dirname, './__mocks__/mockedCache')
    }

  }
  const templateCache = new  TemplateCache(config)

  // ACT
  templateCache.storeTemplate('some/template/path')
  templateCache.getTemplatePath('some-template')
  templateCache.listCachedTemplates()

  // ASSERT
  expect(mockedCache.storeTemplate).toHaveBeenCalledTimes(1)
  expect(mockedCache.getTemplatePath).toHaveBeenCalledTimes(1)
  expect(mockedCache.listCachedTemplates).toHaveBeenCalledTimes(1)
})

