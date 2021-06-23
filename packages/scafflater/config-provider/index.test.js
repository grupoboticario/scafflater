const ConfigProvider = require(".")
const FileSystemUtils = require("../fs-util")

jest.mock('../fs-util')

describe('Config Provider', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('mergeFolderConfig exception', async () => {
    // ARRANGE
    const config = new ConfigProvider()
    FileSystemUtils.readJSON.mockImplementation(async () => 
    {
      throw new Error()
    })

    // ACT & ASSERT
    await expect(ConfigProvider.mergeFolderConfig(null, config))
    .rejects
    .toThrow()
  })

  test('Get config file for folder', async () => {
    // ARRANGE
    const config = new ConfigProvider()
    FileSystemUtils.pathExists.mockResolvedValue(true)
    FileSystemUtils.readJSON.mockResolvedValue({
      config: {
        singleLineComment: '//'
      }
    })

    // ACT
    const newConfig = await ConfigProvider.mergeFolderConfig('some-folder-path', config)

    // ASSERT
    expect(FileSystemUtils.readJSON.mock.calls.length).toBe(1)
    expect(newConfig.singleLineComment).toBe('//')

  })

  test('Config file for folder does not exists', async () => {
    // ARRANGE
    const config = new ConfigProvider()
    FileSystemUtils.pathExists.mockResolvedValue(false)
    FileSystemUtils.readJSON.mockResolvedValue({
      config: {
        singleLineComment: '//'
      }
    })

    // ACT
    const newConfig = await ConfigProvider.mergeFolderConfig('some-folder-path', config)

    // ASSERT
    expect(FileSystemUtils.readJSON.mock.calls.length).toBe(0)
    expect(newConfig).toStrictEqual({ ...config })
  })

  test('Config file does not has config section', async () => {
    // ARRANGE
    const config = new ConfigProvider()
    FileSystemUtils.pathExists.mockResolvedValue(true)
    FileSystemUtils.readJSON.mockResolvedValue({
      hey: 'theres no config here'
    })

    // ACT
    const newConfig = await ConfigProvider.mergeFolderConfig('some-folder-path', config)

    // ASSERT
    expect(FileSystemUtils.readJSON.mock.calls.length).toBe(1)
    expect(newConfig).toStrictEqual({ ...config })
  })

  test('Get config from file template', async () => {
    // ARRANGE
    const config = new ConfigProvider()
    FileSystemUtils.readFileContent.mockResolvedValue(`
    # @scf-config processors [ "a-new-processor" ]
    # @scf-config singleLineComment //
    # @scf-config annotate false
    
    the file content
    `)

    // ACT
    const newConfig = await ConfigProvider.extractConfigFromFileContent('some/path', config)

    // ASSERT
    expect(newConfig.config.processors[0]).toBe('a-new-processor')
    expect(newConfig.config.annotate).toStrictEqual(false)
    expect(newConfig.config.singleLineComment).toStrictEqual('//')
    expect(newConfig.fileContent.includes('@scf-config')).toBe(false)
  })

  test('No config on file template', async () => {
    // ARRANGE
    const config = new ConfigProvider()
    FileSystemUtils.readFileContent.mockResolvedValue(`the file content`)

    // ACT
    const newConfig = await ConfigProvider.extractConfigFromFileContent('some-path', config)

    // ASSERT
    expect(newConfig.fileContent).toBe('the file content')
  })

  test('Bad format processors', async () => {
    // ARRANGE
    const config = new ConfigProvider()
    FileSystemUtils.readFileContent.mockResolvedValue(`
    # @scf-config processors a-new-processor
    
    the file content
    `)

    // ACT && ASSERT
    await expect(ConfigProvider.extractConfigFromFileContent('some/path', config))
    .rejects
    .toThrow(/Could not parse option 'processors'/)

  })

})