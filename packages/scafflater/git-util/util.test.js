/* eslint-disable no-undef */
const {runCommand} = require('./utils')

test('Execute Command', async () => {
  await runCommand('ls', ['-la'])
})
