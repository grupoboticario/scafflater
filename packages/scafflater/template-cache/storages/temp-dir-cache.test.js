/* eslint-disable no-undef */
const TempDirCache = require('./temp-dir-cache')
const fsUtils = require('../../fs-util')

jest.mock('../../fs-util')

describe('Home Dir source', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('Should set path to .scafflater/templates in UserDir', async () => {
    // ARRANGE
    fsUtils.getTempFolder.mockReturnValue('some/temp/path')

    // ACT
    const tempDirCache = new TempDirCache()

    // ASSERT
    expect(tempDirCache.storagePath).toBe('some/temp/path')
  })
})
