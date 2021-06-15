const inquirer = require('inquirer')
const ora = require('ora')
const logger = require('logger')
const chalk = require('chalk')

const parseParametersFlags = parameters => {
  const result = {}

  parameters.forEach(param => {
    let m =  /(?<name>.+)(?::)(?<value>.+)/g.exec(param)
    if (m.length <= 0)
      throw new Error('The parameters is not in the expected pattern: <parameter-name>:<parameter-value>')

    result[m.groups.name] =  m.groups.value
  })

  return result
}

const promptMissingParameters = async (parameterFlags, requireParameters) => {
  const flags = parseParametersFlags(parameterFlags)

  const missingParameters = []
  for (const rp of requireParameters) {
    if (!flags[rp.name])
      missingParameters.push(rp)
  }

  const prompt = missingParameters.length > 0 ? await inquirer.prompt(missingParameters) : {}

  return {...flags, ...prompt}
}

const spinner = async (message, f) => {
  const spinner = ora(message).start()
  try {
    await f()
  } catch (error) {
    spinner.stopAndPersist({symbol: chalk.red('✖')})
    throw error
  }
  spinner.stopAndPersist({symbol: chalk.green('✔')})
}

module.exports = {
  parseParametersFlags,
  promptMissingParameters,
  spinner,
}
