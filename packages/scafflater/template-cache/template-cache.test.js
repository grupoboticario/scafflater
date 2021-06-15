/* eslint-disable no-undef */
const TemplateCache = require('./template-cache')
const LocalTemplateCache = require('./local-template-cache')

test('Throws an exception when the storage does not exists', () => {
  // ARRANJE
  const config = {storage: 'bla'}
  const ts = new TemplateCache()

  // ACT and ASSERT
  expect(() => {
    ts.getTemplateCache(config)
  }).toThrowError("There's no module for source 'bla'")
})

test('Gets the template storage in config', () => {
  // ARRANJE
  const config = {storage: 'local'}
  const ts = new TemplateCache(config)

  // ACT
  const result = ts.getTemplateCache(config)

  // ASSERT
  // eslint-disable-next-line no-proto
  expect(result.__proto__ instanceof TemplateCache).toBe(true)
  expect(result instanceof LocalTemplateCache).toBe(true)
})
