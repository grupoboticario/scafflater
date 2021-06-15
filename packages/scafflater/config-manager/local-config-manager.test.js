/* eslint-disable no-undef */
const LocalConfigManager = require('./')
const FileSystemUtils = require('../fs-util')

jest.mock('../fs-util')

describe('Local config Manager', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('Load inexisting config, creating an default', async () => {
    // ARRANJE
    FileSystemUtils.pathExists.mockReturnValue(false)
    const mockedConfig = {templateInUse: null}
    FileSystemUtils.getJson.mockReturnValue(mockedConfig)

    // ACT
    const config = await new LocalConfigManager().getConfig()

    // ASSERT
    expect(config).toEqual(mockedConfig)
    expect(FileSystemUtils.saveJson.mock.calls.length).toBe(1)
  })

  test('Load existing config', async () => {
    // ARRANJE
    FileSystemUtils.pathExists.mockReturnValue(true)
    const mockedConfig = {templateInUse: null}
    FileSystemUtils.getJson.mockReturnValue(mockedConfig)

    // ACT
    const config = await new LocalConfigManager().getConfig()

    // ASSERT
    expect(config).toEqual(mockedConfig)
    expect(FileSystemUtils.saveJson.mock.calls.length).toBe(0)
  })
})
