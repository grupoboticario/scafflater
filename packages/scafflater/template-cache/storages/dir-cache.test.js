/* eslint-disable no-undef */
const DirCache = require('./dir-cache')
const fsUtil = require('../../fs-util')
const path = require('path')

jest.mock('../../fs-util')

describe('Github template source', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('storeTemplate: Should copy to the local folder', async () => {
    // ARRANGE
    fsUtil.readJSON.mockReturnValue({name: 'some-name', version: 'some-version'})
    const p = 'path/to/some/template'
    const dirCache = new DirCache('path/to/some/template')

    // ACT
    await dirCache.storeTemplate(p)

    // ASSERT
    expect(fsUtil.copyEnsuringDest.mock.calls[0][0]).toBe(p)
    expect(fsUtil.copyEnsuringDest.mock.calls[0][1]).toBe('path/to/some/template/some-name/some-version')
  })

  test('listCachedTemplates: List templates should list stored templates', async () => {
    // ARRANGE
    const dirCache = new DirCache('some/path')

    fsUtil.getDirTreeSync.mockReturnValue({
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
    const out = await dirCache.listCachedTemplates(path)

    // ASSERT
    expect(out.length).toBe(2)
    expect(out[0].versions.length).toBe(2)
    expect(out[0].versions[0].version).toBe('1.0.0')
    expect(out[0].versions[1].version).toBe('2.0.0')
  })

  test('listCachedTemplates: List templates should return null if template folder does not exists', async () => {
    // ARRANGE
    const dirCache = new DirCache('some/path')

    fsUtil.getDirTreeSync.mockReturnValue(null)

    // ACT
    const out = await dirCache.listCachedTemplates(path)

    // ASSERT
    expect(out).toBe(null)
  })

  test('getTemplateFolder: Template folder dos not exists, should return null', async () => {
    // ARRANGE
    const dirCache = new DirCache('ome/path')
    const templateName = 'the-template'

    fsUtil.pathExists.mockResolvedValue(false)

    // ACT &  ASSERT
    await expect(dirCache.getTemplatePath(templateName)).resolves.toBe(null)
  })

  test('getTemplateFolder: Template Version folder does not exists, should return null', async () => {
    // ARRANGE
    const dirCache = new DirCache('ome/path')
    const templateName = 'the-template'
    const templateVersion = 'the-template-version'
    fsUtil.pathExists.mockResolvedValueOnce(true)
    fsUtil.pathExists.mockResolvedValueOnce(false)
    fsUtil.getDirTreeSync.mockReturnValue(null)

    // ACT & ASSERT
    await expect(dirCache.getTemplatePath(templateName, templateVersion))
      .resolves
      .toBe(null)
  })

  test('getTemplateFolder: Theres no version for template, should return null if', async () => {
    // ARRANGE
    const dirCache = new DirCache('some/path')
    const templateName = 'the-template'
    fsUtil.pathExists.mockResolvedValueOnce(true)

    // ACT
    fsUtil.getDirTreeSync.mockReturnValue(null)
    const out = await dirCache.getTemplatePath(templateName)
    fsUtil.getDirTreeSync.mockReturnValue({name: 'templates', children: []})
    const out2 = await dirCache.getTemplatePath(templateName)

    // ASSERT
    expect(out).toBe(null)
    expect(out2).toBe(null)
  })
  
  test('getTemplateFolder: Get last template, should return the latest version folder', async () => {
    // ARRANGE
    const dirCache = new DirCache('some/path')

    fsUtil.getDirTreeSync.mockReturnValue({
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
    fsUtil.pathExists.mockReturnValue(true)

    // ACT
    const out = await dirCache.getTemplatePath('tmpl-01')

    // ASSERT
    expect(out).toBe('some/path/tmpl-01/2.0.0')
  })
})
