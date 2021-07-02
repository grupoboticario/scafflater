const {maskParameters} = require('./')


test('Mask Parameters', () => {
  // ARRANGE
  const templateParameters = [
    {
      name: 'shouldMask',
      mask: true
    },
    {
      name: 'shouldNotMask',
      mask: false
    },
    {
      name: 'shouldNotMask2'
    }
  ]

  const parameters = {
    shouldMask: 'some-password',
    shouldNotMask: 1,
    shouldNotMask2: 'open text'
  }

  // ACT
  const result = maskParameters(parameters, templateParameters)

  // ASSERT
  expect(result.shouldMask).toBe('******')
  expect(result.shouldNotMask).toBe(1)
  expect(result.shouldNotMask2).toBe('open text')

})