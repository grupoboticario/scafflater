const fsUtil = require('../../fs-util')
const HandlebarsProcessor = require('./handlebars-processor')
const Handlebars = require('handlebars')


jest.mock('../../fs-util')
jest.mock('handlebars')

describe('HandlebarsProcessor', ()=>{
  beforeEach(()=>{
    jest.resetAllMocks()
  })

  test('Folder is null or does not exists, should not call registerHelper', async ()=>{
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(false)

    // ACT
    await HandlebarsProcessor.loadHelpersFolder(null)
    await HandlebarsProcessor.loadHelpersFolder('this/path/does/not/exists')

    // ASSERT
    expect(Handlebars.registerHelper).toHaveBeenCalledTimes(0)

  })

  test('Register helpers', async () => {
    // ARRANGE
    fsUtil.pathExists.mockResolvedValue(true)
    fsUtil.listFilesByExtensionDeeply.mockResolvedValue([
      'helper1.js',
      'helper2.js'
    ])
    fsUtil.require.mockReturnValueOnce("function1")
    fsUtil.require.mockReturnValueOnce("function2")

    // ACT
    await HandlebarsProcessor.loadHelpersFolder('this/path/exists')

    // ASSERT
    expect(Handlebars.registerHelper).toHaveBeenCalledTimes(2)
    expect(Handlebars.registerHelper).toHaveBeenCalledWith('helper1', 'function1')
    expect(Handlebars.registerHelper).toHaveBeenCalledWith('helper2', 'function2')
  })

})


