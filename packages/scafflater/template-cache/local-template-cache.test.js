/* eslint-disable no-undef */
const LocalTemplateCache = require('./local-template-cache')
const FileSystemUtils = require('../fs-util')
const path = require('path')

jest.mock('../fs-util')

describe('Github template source', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('Should copy to the local folder', async () => {
    // ARRANJE
    const path = 'path/to/some/template'
    const config = {
      templateConfigFileName: 'the_template_condig.json',
      localStorageTemplatesPath: '/path/to/store/templates',
    }
    const localTemplateCache = new LocalTemplateCache(config)

    FileSystemUtils.getJson.mockReturnValue({name: 'some-name', version: 'some-version'})

    // ACT
    await localTemplateCache.storeTemplate(path)

    // ASSERT
    expect(FileSystemUtils.copy.mock.calls[0][0]).toBe(path)
    expect(FileSystemUtils.copy.mock.calls[0][1]).toBe('/path/to/store/templates/some-name/some-version')
  })

  test('List templates should list stored templates', async () => {
    // ARRANJE
    const config = {
      localStorageTemplatesPath: path.join(__dirname, '.test-resources/templates'),
    }
    const localTemplateCache = new LocalTemplateCache(config)

    FileSystemUtils.getDirTree.mockReturnValue({
      name: 'templates',
      children: [
        {
          name: 'tmpl-01',
          children: [
            {
              name: '1.0.0',
            },
            {
              name: '2.0.0',
            },
          ],
        },
        {
          name: 'tmpl-02',
          children: [
            {
              name: '3.0.0',
            },
          ],
        },
      ],
    })

    // ACT
    const out = await localTemplateCache.listCachedTemplates(path)

    // ASSERT
    expect(out.length).toBe(2)
    expect(out[0].versions.length).toBe(2)
    expect(out[0].versions[0].version).toBe('1.0.0')
    expect(out[0].versions[1].version).toBe('2.0.0')
  })

  test('List templates should retun null if template folder does not exists', async () => {
    // ARRANJE
    const config = {
      localStorageTemplatesPath: path.join(__dirname, '.test-resources/templates'),
    }
    const localTemplateCache = new LocalTemplateCache(config)

    FileSystemUtils.getDirTree.mockReturnValue(null)

    // ACT
    const out = await localTemplateCache.listCachedTemplates(path)

    // ASSERT
    expect(out).toBe(null)
  })

  test('Get template folder should retun null if template folder does not exists', async () => {
    // ARRANJE
    const config = {
      localStorageTemplatesPath: path.join(__dirname, '.test-resources/templates'),
    }
    const localTemplateCache = new LocalTemplateCache(config)
    const templateName = 'the-template'
    const templateversion = 'the-template-version'

    FileSystemUtils.getDirTree.mockReturnValue(null)

    // ACT
    const out = await localTemplateCache.getTemplateFolder(templateName, templateversion)

    // ASSERT
    expect(out).toBe(null)
  })

  test('Get template folder should retun null if theres no version for template', async () => {
    // ARRANJE
    const config = {
      localStorageTemplatesPath: path.join(__dirname, '.test-resources/templates'),
    }
    const localTemplateCache = new LocalTemplateCache(config)
    const templateName = 'the-template'

    // ACT
    FileSystemUtils.getDirTree.mockReturnValue(null)
    const out = await localTemplateCache.getTemplateFolder(templateName)
    FileSystemUtils.getDirTree.mockReturnValue({name: 'templates', children: []})
    const out2 = await localTemplateCache.getTemplateFolder(templateName)

    // ASSERT
    expect(out).toBe(null)
    expect(out2).toBe(null)
  })

  test('Should copy to the local folder', async () => {
    // ARRANJE
    const path = 'path/to/some/template'
    const config = {
      templateConfigFileName: 'the_template_condig.json',
      localStorageTemplatesPath: '/path/to/store/templates',
    }
    const localTemplateCache = new LocalTemplateCache(config)

    FileSystemUtils.getJson.mockReturnValue({name: 'some-name', version: 'some-version'})

    // ACT
    await localTemplateCache.storeTemplate(path)

    // ASSERT
    expect(FileSystemUtils.copy.mock.calls[0][0]).toBe(path)
    expect(FileSystemUtils.copy.mock.calls[0][1]).toBe('/path/to/store/templates/some-name/some-version')
  })

  test('Get template folder should return the version for the last template', async () => {
    // ARRANJE
    const config = {
      templateConfigFileName: 'the_template_condig.json',
      localStorageTemplatesPath: '/path/to/store/templates',
    }
    const localTemplateCache = new LocalTemplateCache(config)

    FileSystemUtils.getDirTree.mockReturnValue({
      name: 'tmpl-01',
      children: [
        {
          name: '1.0.0',
        },
        {
          name: '2.0.0',
        },
      ],
    })
    FileSystemUtils.pathExists.mockReturnValue(true)

    // ACT
    const out = localTemplateCache.getTemplateFolder('tmpl-01')

    // ASSERT
    expect(out).toBe('/path/to/store/templates/tmpl-01/2.0.0')
  })
})
