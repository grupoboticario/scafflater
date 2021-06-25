/* eslint-disable no-undef */
const Scafflater = require('./scafflater')
const fsUtil = require('./fs-util')
const GitTemplateSource = require('./template-source/git-template-source')
const git = require('isomorphic-git')

jest.mock('./fs-util')
jest.mock('isomorphic-git')

test('Create Scafflater with github credentials, config in template source should be set', async () => {
  // ARRANGE
  const config = {
    github_username: 'some-user',
    github_password: 'the-secret-password'
  }
  fsUtil.readJSON.mockResolvedValue({
    name: 'template-name',
    version: 'template-version'
  })

  // ACT
  const scf = new Scafflater(config)
  await scf.templateManager.templateSource.getTemplate('some-source', 'some-path')

  // ASSERT
  expect(scf.templateManager.templateSource.config.github_username).toBe('some-user')
  expect(scf.templateManager.templateSource.config.github_password).toBe('the-secret-password')
  expect(git.clone.mock.calls[0][0].headers.Authentication).toBe(`Basic some-user:the-secret-password`.toString('base64'))

})
