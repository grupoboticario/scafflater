const fsUtils = require('.')
jest.mock('glob')
const { glob } = require('glob')

describe("Mock glob", () => {
  beforeEach(()=>{
    jest.clearAllMocks();
  })

  test('Glob throws an exception', async ()=>{
    // ARRANGE
    glob.mockImplementation((_, __, callback) => { 
      callback(new Error(), null) 
    })

    // ACT & ASSERT
    await expect(fsUtils.listFilesDeeply('folderPath', '__...........__'))
    .rejects
    .toThrow()
  })

  test('listFilesByExtensionDeeply', async ()=>{
    // ARRANGE
    glob.mockImplementation((_, __, callback) => { 
      callback(null, ['some-file']) 
    })

    // ACT
    await fsUtils.listFilesByExtensionDeeply('folder/path', 'ext')

    // ASSERT
    expect(glob.mock.calls[0][0]).toBe('/**/*.ext')
    expect(glob.mock.calls[0][1]).toStrictEqual({"root": "folder/path"})
  })

  test('listFilesByNameDeeply', async ()=>{
    // ARRANGE
    glob.mockImplementation((_, __, callback) => { 
      callback(null, ['some-file']) 
    })

    // ACT
    await fsUtils.listFilesByNameDeeply('folder/path', 'my-file.ext')

    // ASSERT
    expect(glob.mock.calls[0][0]).toBe('/**/my-file.ext')
    expect(glob.mock.calls[0][1]).toStrictEqual({"root": "folder/path"})
  })

})
