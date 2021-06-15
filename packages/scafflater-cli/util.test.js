/* eslint-disable no-undef */
const {parseParametersFlags, promptMissingParameters} = require('./util')
const inquirer = require('inquirer')
jest.mock('inquirer')

test('Parse Parameters Flags', () => {
  // ARRANJE
  const parameters = ['name1:value1', 'name2:value2']

  // ACT
  const result = parseParametersFlags(parameters)

  // ASSERT
  expect(result.name1).toBe('value1')
  expect(result.name2).toBe('value2')
})

test('Prompt missing parameters', async () => {
  // ARRANJE
  const parameterFlags = ['name1:value1']
  const templateParameters = [
    {
      type: 'input',
      name: 'name2',
      message: 'What`s the system/project/product?',
    },
  ]
  inquirer.prompt.mockReturnValue({name2: 'value2'})

  // ACT
  const result = await promptMissingParameters(parameterFlags, templateParameters)

  // ASSERT
  expect(inquirer.prompt.mock.calls[0][0]).toStrictEqual(templateParameters)
  expect(result.name1).toBe('value1')
  expect(result.name2).toBe('value2')
})
