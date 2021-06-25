/* eslint-disable no-undef */
const Scafflater = require('./scafflater')
const fsUtil = require('./fs-util')
const GitTemplateSource = require('./template-source/git-template-source')

//jest.mock('./template-source/git-template-source')

test('Call with github credentials', () => {
  // ARRANGE
  const config = {
    github_username: 'some-user',
    github_password: 'the-secret-password'
  }

  // ACT
  const scf = new Scafflater(config)

  // ASSERT
  expect(scf.templateManager.templateSource.config.github_username).toBe('some-user')
  expect(scf.templateManager.templateSource.config.github_password).toBe('the-secret-password')

})
