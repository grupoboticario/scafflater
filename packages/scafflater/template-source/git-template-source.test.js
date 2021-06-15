/* eslint-disable no-undef */
const GitTemplateSource = require('./')
const GitUtil = require('../git-util')
const FileSystemUtils = require('../fs-util')

jest.mock('../git-util')
jest.mock('../fs-util')

describe('Github template source', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('Should clone to the folder in parameter', async () => {
    // ARRANJE
    const repo = 'some/repo'
    const virtualFolder = 'some/virtual/folder'
    const gitTemplateSource = new GitTemplateSource()
    FileSystemUtils.getJson.mockReturnValue({name: 'template-name', version: '0.0.0'})

    // ACT
    const out = await gitTemplateSource.getTemplate(repo, virtualFolder)

    // ASSERT
    expect(out).toStrictEqual({
      path: virtualFolder,
      config: {
        name: 'template-name',
        version: '0.0.0',
        source: {
          name: 'github',
          key: 'some/repo',
          github: {
            baseUrlApi: 'https://api.github.com',
            baseUrl: 'https://github.com',
          },
        },
      },
    })
    expect(GitUtil.clone.mock.calls[0][0]).toBe(repo)
    expect(GitUtil.clone.mock.calls[0][1]).toBe(virtualFolder)
  })

  test('Should clone to a temp folder', async () => {
    // ARRANJE
    const repo = 'some/repo'
    const tempFolder = 'some/temp/folder'
    const gitTemplateSource = new GitTemplateSource()
    FileSystemUtils.getJson.mockReturnValue({name: 'template-name', version: '0.0.0'})
    FileSystemUtils.getTempFolder.mockReturnValue(tempFolder)

    // ACT
    const out = await gitTemplateSource.getTemplate(repo)

    // ASSERT
    expect(out).toStrictEqual({
      path: tempFolder,
      config: {
        name: 'template-name',
        version: '0.0.0',
        source: {
          name: 'github',
          key: 'some/repo',
          github: {
            baseUrlApi: 'https://api.github.com',
            baseUrl: 'https://github.com',
          },
        },
      },
    })
    expect(GitUtil.clone.mock.calls[0][0]).toBe(repo)
    expect(GitUtil.clone.mock.calls[0][1]).toBe(tempFolder)
  })
})
