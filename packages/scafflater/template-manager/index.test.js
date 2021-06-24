/* eslint-disable node/no-unpublished-require */
/* eslint-disable no-undef */
const ConfigProvider = require('../config-provider')
const fsUtil = require('../fs-util')
const TemplateCache = require('../template-cache')
const TempDirCache = require('../template-cache/storages/temp-dir-cache')
const TemplateSource = require('../template-source')
const TemplateManager = require('./')

jest.mock('../fs-util')
jest.mock('../template-cache')
jest.mock('../template-source')

describe('Template Manager tests', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  const templateCache = new TemplateCache()
  const templateSource = new TemplateSource()

  test('getTemplateFromSource', async () => {
    // ARRANGE
    const templateManager = new TemplateManager()
    templateManager.config = new ConfigProvider()
    templateCache.storeTemplate.mockResolvedValue('the/cache/path')
    templateSource.getTemplate.mockResolvedValue({ path: 'some/path' })
    fsUtil.readJSON.mockResolvedValue({name: 'some-template'})

    // ACT
    const out = await templateManager.getTemplateFromSource('some/source/key')

    // ASSERT
    expect(templateSource.getTemplate.mock.calls.length).toBe(1)
    expect(templateCache.storeTemplate.mock.calls.length).toBe(1)
    expect(out).toStrictEqual({name: 'some-template'})
  })

  test('getTemplatePath', async()=>{
    // ARRANGE
    const templateManager = new TemplateManager()

    // ACT
    const result = templateManager.getTemplatePath('some-template', 'some-version')

    // ARRANGE
    expect(templateCache.getTemplatePath).toHaveBeenCalledTimes(1)
  })

  test('getPartial: Should return the partial template', async () => {
    // ARRANGE
    const partialPath = 'the/partial/path'
    const configList = ['the/partial/path/_scf.json']
    const config = {
      name: 'the-partial-name',
      parameters: [],
    }

    templateCache.getTemplatePath.mockReturnValue(partialPath)
    fsUtil.getTempFolder.mockReturnValue('some/temp/folder')
    fsUtil.listFilesByNameDeeply.mockReturnValue(configList)
    fsUtil.readJSON.mockReturnValue(config)
    const templateManager = new TemplateManager(config)

    // ACT
    const out = await templateManager.getPartial('the-partial-name', 'template')

    // ASSERT
    expect(out.path).toBe('the/partial/path')
    expect(out.config).toBe(config)
  })

  test('getPartial: template does not exists, should return null', async () => {
    // ARRANGE
    const configList = ['the/partial/path/_scf.json']
    const config = {
      name: 'the-partial-name',
      parameters: [],
    }

    templateCache.getTemplatePath.mockReturnValue(null)
    fsUtil.getTempFolder.mockReturnValue('some/temp/folder')
    fsUtil.listFilesByNameDeeply.mockReturnValue(configList)
    fsUtil.readJSON.mockReturnValue(config)
    const templateManager = new TemplateManager(config)

    // ACT
    const out = await templateManager.getPartial('the-partial-name', 'template')

    // ASSERT
    expect(out).toBe(null)
  })

  test('getPartial: theres no partials on template, should return null', async () => {
    // ARRANGE
    templateCache.getTemplatePath.mockReturnValue('the/template/path')
    fsUtil.getTempFolder.mockReturnValue('some/temp/folder')
    fsUtil.listFilesByNameDeeply.mockReturnValue(null)
    const templateManager = new TemplateManager(new ConfigProvider())

    // ACT
    const out = await templateManager.getPartial('the-partial-name', 'template')

    // ASSERT
    expect(out).toBe(null)
  })
  
  test('getPartial: the partial does not exists in the template, should return null', async () => {
    // ARRANGE
    const configList = ['the/partial/path/_scf.json']
    const config = {
      name: 'the-partial-name',
      parameters: [],
    }

    templateCache.getTemplatePath.mockReturnValue('some/template/path')
    fsUtil.getTempFolder.mockReturnValue('some/temp/folder')
    fsUtil.listFilesByNameDeeply.mockReturnValue(configList)
    fsUtil.readJSON.mockReturnValue(config)
    const templateManager = new TemplateManager(config)

    // ACT
    const out = await templateManager.getPartial('some-other-partial-name', 'template')

    // ASSERT
    expect(out).toBe(null)
  })

  test('listPartials: Should return list of partial templates', async () => {
    // ARRANGE
    const partialPath = 'the/partial/path'
    const configList = ['the/partial/path/_scf.json']
    const config = {
      name: 'the-partial-name',
      parameters: [],
    }
    templateCache.getTemplatePath.mockReturnValue(partialPath)
    fsUtil.getTempFolder.mockReturnValue('some/temp/folder')
    fsUtil.listFilesByNameDeeply.mockReturnValue(configList)
    fsUtil.readJSON.mockReturnValue(config)
    const templateManager = new TemplateManager(config)

    // ACT
    const out = await templateManager.listPartials('template')

    // ASSERT
    expect(out.length).toBe(1)
    expect(out[0].path).toBe('the/partial/path')
    expect(out[0].config).toBe(config)
  })

})
