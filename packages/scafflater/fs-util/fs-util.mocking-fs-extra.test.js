/* eslint-disable no-undef */
const FileSystemUtils = require('../fs-util')
const path = require('path')
const fs = require('fs-extra')
const {EOL} = require('os')

jest.mock('fs-extra')

test('save File', async () => {
  // ARRANJE
  const filePath = path.join(__dirname, '.test-resources', 'sample-file.txt')
  fs.existsSync.mockReturnValue(true)

  // ACT
  await FileSystemUtils.saveFile(filePath, 'new data', true)

  // ASSERT
  expect(fs.writeFileSync.mock.calls[0][1]).toBe(EOL + EOL + 'new data')
})
