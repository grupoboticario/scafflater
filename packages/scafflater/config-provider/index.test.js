const ConfigProvider = require(".")
const FileSystemUtils = require("../fs-util")

jest.mock('../fs-util')

describe('Config Provider', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('Get config file for folder', () => {
    // ARRANGE
    const config = new ConfigProvider()
    FileSystemUtils.pathExists.mockReturnValue(true)
    FileSystemUtils.getJson.mockReturnValue({
      config: {
        singleLineComment: '//'
      }
    })

    // ACT
    const newConfig = ConfigProvider.mergeFolderConfig('some-folder-path', config)

    // ASSERT
    expect(FileSystemUtils.getJson.mock.calls.length).toBe(1)
    expect(newConfig.singleLineComment).toBe('//')

  })

  test('Config file for folder does not exists', () => {
    // ARRANGE
    const config = new ConfigProvider()
    FileSystemUtils.pathExists.mockReturnValue(false)
    FileSystemUtils.getJson.mockReturnValue({
      config: {
        singleLineComment: '//'
      }
    })

    // ACT
    const newConfig = ConfigProvider.mergeFolderConfig('some-folder-path', config)

    // ASSERT
    expect(FileSystemUtils.getJson.mock.calls.length).toBe(0)
    expect(newConfig).toStrictEqual({ ...config })
  })

  test('Config file does not has config section', () => {
    // ARRANGE
    const config = new ConfigProvider()
    FileSystemUtils.pathExists.mockReturnValue(true)
    FileSystemUtils.getJson.mockReturnValue({
      hey: 'theres no config here'
    })

    // ACT
    const newConfig = ConfigProvider.mergeFolderConfig('some-folder-path', config)

    // ASSERT
    expect(FileSystemUtils.getJson.mock.calls.length).toBe(1)
    expect(newConfig).toStrictEqual({ ...config })
  })

  test('Get config from file template', () => {
    // ARRANGE
    const config = new ConfigProvider()
    const fileContent = `
    # @scf-config processors [ "a-new-processor" ]
    # @scf-config singleLineComment //
    # @scf-config annotate false
    
    the file content
    `

    // ACT
    const newConfig = ConfigProvider.mergeConfigFromFileContent(fileContent, config)

    // ASSERT
    expect(newConfig.config.processors[0]).toBe('a-new-processor')
    expect(newConfig.config.annotate).toStrictEqual(false)
    expect(newConfig.config.singleLineComment).toStrictEqual('//')
    expect(newConfig.fileContent.includes('@scf-config')).toBe(false)
  })

  test('No config on file template', () => {
    // ARRANGE
    const config = new ConfigProvider()
    const fileContent = `the file content`

    // ACT
    const newConfig = ConfigProvider.mergeConfigFromFileContent(fileContent, config)

    // ASSERT
    expect(newConfig.fileContent).toBe('the file content')
  })

})