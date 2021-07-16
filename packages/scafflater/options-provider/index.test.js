const OptionsProvider = require(".")
const FileSystemUtils = require("../fs-util")

jest.mock('../fs-util')

describe('Config Provider', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('mergeFolderConfig exception', async () => {
    // ARRANGE
    const config = new OptionsProvider()
    FileSystemUtils.readJSON.mockImplementation(async () => 
    {
      throw new Error()
    })

    // ACT & ASSERT
    await expect(OptionsProvider.mergeFolderConfig(null, config))
    .rejects
    .toThrow()
  })

  test('Get config file for folder', async () => {
    // ARRANGE
    const config = new OptionsProvider()
    FileSystemUtils.pathExists.mockResolvedValue(true)
    FileSystemUtils.readJSON.mockResolvedValue({
      config: {
        lineCommentTemplate: '// {{{comment}}}'
      }
    })

    // ACT
    const newConfig = await OptionsProvider.mergeFolderConfig('some-folder-path', config)

    // ASSERT
    expect(FileSystemUtils.readJSON.mock.calls.length).toBe(1)
    expect(newConfig.lineCommentTemplate).toBe('// {{{comment}}}')

  })

  test('Config file for folder does not exists', async () => {
    // ARRANGE
    const config = new OptionsProvider()
    FileSystemUtils.pathExists.mockResolvedValue(false)
    FileSystemUtils.readJSON.mockResolvedValue({
      config: {
        lineCommentTemplate: '// {{{comment}}}'
      }
    })

    // ACT
    const newConfig = await OptionsProvider.mergeFolderConfig('some-folder-path', config)

    // ASSERT
    expect(FileSystemUtils.readJSON.mock.calls.length).toBe(0)
    expect(newConfig).toStrictEqual({ ...config })
  })

  test('Config file does not has config section', async () => {
    // ARRANGE
    const config = new OptionsProvider()
    FileSystemUtils.pathExists.mockResolvedValue(true)
    FileSystemUtils.readJSON.mockResolvedValue({
      hey: 'theres no config here'
    })

    // ACT
    const newConfig = await OptionsProvider.mergeFolderConfig('some-folder-path', config)

    // ASSERT
    expect(FileSystemUtils.readJSON.mock.calls.length).toBe(1)
    expect(newConfig).toStrictEqual({ ...config })
  })

  test('Get config from file template', async () => {
    // ARRANGE
    const config = new OptionsProvider()
    FileSystemUtils.readFileContent.mockResolvedValue(`
    # @scf-option {"processors":[ "a-new-processor" ]}
    # @scf-option {"lineCommentTemplate":"// {{comment}}"}
    # @scf-option {"annotate":false}
    # @scf-option {"ignore":true}
    # @scf-option {"targetName":"some-name"}
    
    the file content
    `)

    // ACT
    const newConfig = await OptionsProvider.extractConfigFromFileContent('some/path', config)

    // ASSERT
    expect(newConfig.processors[0]).toBe('a-new-processor')
    expect(newConfig.annotate).toStrictEqual(false)
    expect(newConfig.ignore).toStrictEqual(true)
    expect(newConfig.lineCommentTemplate).toStrictEqual('// {{comment}}')
  })

  test('Remove config from file template', async () => {
    // ARRANGE
    const config = new OptionsProvider()
    const content = `
    # @scf-option {"processors":[ "a-new-processor" ]}
    # @scf-option {"lineCommentTemplate":"// {{comment}}"}
    # @scf-option {"annotate":false}
    # @scf-option {"ignore":true}
    # @scf-option {"targetName":"some-name"}
    
    the file content
    `

    // ACT
    const newContent = await OptionsProvider.removeConfigFromString(content, config)

    // ASSERT
    expect(newContent.includes('@scf-option')).toBe(false)
  })

  test('Get config from content with regions, should ignore region config', async () => {
    // ARRANGE
    const config = new OptionsProvider()
    const str = `
    # @scf-option {"processors":[ "processor1" ]}
    # @scf-region
      # @scf-option {"processors":[ "processor2" ]}
    # @end-scf-region
    
    the file content
    `

    // ACT
    const newConfig = await OptionsProvider.extractConfigFromString(str, config)

    // ASSERT
    expect(newConfig.processors[0]).toBe('processor1')
  })

  test('No config on file template', async () => {
    // ARRANGE
    const config = { ...new OptionsProvider() }
    FileSystemUtils.readFileContent.mockResolvedValue(`the file content`)

    // ACT
    const newConfig = await OptionsProvider.extractConfigFromFileContent('some-path', config)

    // ASSERT
    expect(newConfig).toStrictEqual(config)
  })

})