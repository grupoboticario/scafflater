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
        lineCommentTemplate: '// {{{comment}}}'
      }
    })

    // ACT
    const newConfig = await ConfigProvider.mergeFolderConfig('some-folder-path', config)

    // ASSERT
    expect(FileSystemUtils.readJSON.mock.calls.length).toBe(1)
    expect(newConfig.lineCommentTemplate).toBe('// {{{comment}}}')

  })

  test('Config file for folder does not exists', async () => {
    // ARRANGE
    const config = new ConfigProvider()
    FileSystemUtils.pathExists.mockResolvedValue(false)
    FileSystemUtils.readJSON.mockResolvedValue({
      config: {
        lineCommentTemplate: '// {{{comment}}}'
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
    # @scf-config {"processors":[ "a-new-processor" ]}
    # @scf-config {"lineCommentTemplate":"// {{comment}}"}
    # @scf-config {"annotate":false}
    # @scf-config {"ignore":true}
    # @scf-config {"targetName":"some-name"}
    
    the file content
    `)

    // ACT
    const newConfig = await ConfigProvider.extractConfigFromFileContent('some/path', config)

    // ASSERT
    expect(newConfig.config.processors[0]).toBe('a-new-processor')
    expect(newConfig.config.annotate).toStrictEqual(false)
    expect(newConfig.config.ignore).toStrictEqual(true)
    expect(newConfig.config.lineCommentTemplate).toStrictEqual('// {{comment}}')
  })

  test('Remove config from file template', async () => {
    // ARRANGE
    const config = new ConfigProvider()
    const content = `
    # @scf-config {"processors":[ "a-new-processor" ]}
    # @scf-config {"lineCommentTemplate":"// {{comment}}"}
    # @scf-config {"annotate":false}
    # @scf-config {"ignore":true}
    # @scf-config {"targetName":"some-name"}
    
    the file content
    `

    // ACT
    const newContent = await ConfigProvider.removeConfigFromString(content, config)

    // ASSERT
    expect(newContent.includes('@scf-config')).toBe(false)
  })

  test('Get config from content with regions, should ignore region config', async () => {
    // ARRANGE
    const config = new ConfigProvider()
    const str = `
    # @scf-config {"processors":[ "processor1" ]}
    # @scf-region
      # @scf-config {"processors":[ "processor2" ]}
    # @end-scf-region
    
    the file content
    `

    // ACT
    const newConfig = await ConfigProvider.extractConfigFromString(str, config)

    // ASSERT
    expect(newConfig.config.processors[0]).toBe('processor1')
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

})