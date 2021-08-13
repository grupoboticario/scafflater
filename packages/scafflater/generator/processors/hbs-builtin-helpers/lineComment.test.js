const { ScafflaterOptions } = require("../../../options");
const lineComment = require("./lineComment");

test("lineComment handlebars helper", () => {
  // ARRANGE
  const context = {};
  const mockOptions = {
    fn: jest.fn(),
    data: {
      root: {
        options: new ScafflaterOptions(),
      },
    },
  };
  mockOptions.fn.mockReturnValue("some comment");

  // ACT
  const comment = lineComment(context, mockOptions);

  // ASSERT
  expect(comment).toBe("# some comment");
});
