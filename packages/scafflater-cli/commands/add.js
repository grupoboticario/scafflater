const {Command, flags} = require('@oclif/command')
const TemplateSource = require('template-source')
const Scafflater = require('scafflater')
const TemplateManager = require('template-manager')
const TemplateCache = require('template-cache')
const {promptMissingParameters, spinner} = require('../util')
const FileSystemUtils = require('fs-util')
const path = require('path')
const logger = require('logger')
const chalk = require('chalk')
const inquirer = require('inquirer')

class AddPartialCommand extends Command {
  async run() {
    try {
      const {flags} = this.parse(AddPartialCommand)
      const outputInfoPath = path.join(flags.output, '_scf.json')
      if (!FileSystemUtils.pathExists(outputInfoPath)) {
        logger.error('The template is not initialized!')
        logger.error(`Run ${chalk.bold('init')} to initialize the template at the ${chalk.bold('output folder')} before adding partials!`)
        return
      }

      const source = new TemplateSource()
      const cache = new TemplateCache()
      const manager = new TemplateManager(source, cache)

      const outputInfo = FileSystemUtils.getJson(outputInfoPath)

      // Checking if the template is cached
      let cachePath = await cache.getTemplatePath(outputInfo.template.name, outputInfo.template.version)
      if (!cachePath) {
        // Caching template
        await spinner(`Getting template from ${outputInfo.template.source.key}`, async () => {
          await manager.getTemplateFromSource(outputInfo.template.source.key)
        })
        cachePath = await cache.getTemplatePath(outputInfo.template.name, outputInfo.template.version)
        if (!cachePath) {
          logger.error(`Cannot get template ${chalk.bold(outputInfo.template.name)} (version ${chalk.bold(outputInfo.template.version)}) on ${outputInfo.template.source.key}`)
          return
        }
      }

      const partials = await manager.listPartials(outputInfo.template.name, outputInfo.template.version)
      if (!partials) {
        logger.error(`No partials available on template ${chalk.bold(outputInfo.template.name)} (version ${chalk.bold(outputInfo.template.version)})`)
        return
      }

      let partial = null
      if (flags.partialName && flags.partialName.length > 0) {
        // Validating partialName flag
        partial = partials.find(p => {
          return p.config.name === flags.partialName
        })
        if (!partial) {
          logger.error(`The partial ${chalk.bold(flags.partialName)} is not available on template ${chalk.bold(outputInfo.template.name)} (version ${chalk.bold(outputInfo.template.version)})`)
        }
      } else {
        const prompt = await  inquirer.prompt([
          {
            type: 'rawlist',
            name: 'partialName',
            message: 'Which partial do you want to?',
            choices: partials.filter(p => p.config.type === 'partial').map(p => p.config.name),
          },
        ])
        partial = partials.find(p => {
          return p.config.name === prompt.partialName
        })
      }

      const parameters = await promptMissingParameters(flags.parameters, partial.config.parameters)

      await spinner('Running partial template', async () => {
        const scafflater = new Scafflater()
        await scafflater.runPartial(partial.config.name, parameters, flags.output)
      })

      logger.log('notice', 'Partial added to output!')
    } catch (error) {
      logger.error(error)
    }
  }
}

AddPartialCommand.description = `Adds a template partial in a output folder
...
`

AddPartialCommand.flags = {
  partialName: flags.string({char: 'n', description: 'The partial name', default: null}),
  output: flags.string({char: 'o', description: 'The output folder', default: './'}),
  parameters: flags.string({char: 'p', description: 'The parameters to init template', default: [], multiple: true}),
}

module.exports = AddPartialCommand
