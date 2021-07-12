const ConfigProvider = require('../../../config-provider')
const lineComment = require('./lineComment')


test('lineComment handlebars helper', () => {
  // ARRANGE
  const context = { }
  const mockOptions = {
    fn: jest.fn(),
    data:{
      root: {
        config: new ConfigProvider()
      }
    }
  }
  mockOptions.fn.mockReturnValue("some comment")

  // ACT
  const comment = lineComment(context, mockOptions)

  // ASSERT
  expect(comment).toBe("# some comment")
})