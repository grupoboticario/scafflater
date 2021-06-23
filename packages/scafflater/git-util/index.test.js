/* eslint-disable no-undef */
const GitUtil = require('./')
const { runCommand } = require('./utils')
const fs = require('../fs-util')

jest.mock('./utils')
jest.mock('../fs-util')

test('Clone repo', async () => {
  // ARRANGE
  runCommand.mockResolvedValue('A returned command')
  fs.getTempFolder.mockResolvedValue('/some/temp/path')

  // ACT
  const temp = await GitUtil.cloneToTempPath('some-repo')

  // ASSERT
  expect(temp).toBe('/some/temp/path')
  expect(runCommand).toHaveBeenCalledWith('git', [ 'clone', 'some-repo', '/some/temp/path' ])
})
