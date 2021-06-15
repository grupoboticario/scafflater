/* eslint-disable node/no-unpublished-require */
/* eslint-disable no-undef */
const FileSystemUtils = require('../fs-util')
const TemplateCache = require('../template-cache')
const TemplateSource = require('../template-source')
const TemplateManager = require('./')

jest.mock('../fs-util')
jest.mock('../template-cache')

describe('Template Manager tests', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Should return list of partial templates', async () => {
    // ARRANJE
    const partialPath = 'the/partial/path'
    const configList = ['the/partial/path/_scf.json']
    const config = {
      name: 'the-partial-name',
      parameters: [],
    }
    const templateCache = new TemplateCache()
    templateCache.getTemplatePath.mockReturnValue(partialPath)
    FileSystemUtils.listScfConfigTreeInPath.mockReturnValue(configList)
    FileSystemUtils.getJson.mockReturnValue(config)
    const templateManager = new TemplateManager(new TemplateSource(), templateCache)

    // ACT
    const out = await templateManager.listPartials('template')

    // ASSERT
    expect(out.length).toBe(1)
    expect(out[0].path).toBe('the/partial/path')
    expect(out[0].config).toBe(config)
  })

  test('Should return the partial template', async () => {
    // ARRANJE
    const partialPath = 'the/partial/path'
    const configList = ['the/partial/path/_scf.json']
    const config = {
      name: 'the-partial-name',
      parameters: [],
    }
    const templateCache = new TemplateCache()
    templateCache.getTemplatePath.mockReturnValue(partialPath)
    FileSystemUtils.listScfConfigTreeInPath.mockReturnValue(configList)
    FileSystemUtils.getJson.mockReturnValue(config)
    const templateManager = new TemplateManager(new TemplateSource(), templateCache)

    // ACT
    const out = await templateManager.getPartial('the-partial-name', 'template')

    // ASSERT
    expect(out.path).toBe('the/partial/path')
    expect(out.config).toBe(config)
  })
})
