const {Command, flags} = require('@oclif/command')
const TemplateSource = require('template-source')
const Scafflater = require('scafflater')
const TemplateManager = require('template-manager')
const TemplateCache = require('template-cache')
const {promptMissingParameters, spinner} = require('../util')
const FileSystemUtils = require('fs-util')
const path = require('path')
const logger = require('logger')

class InitCommand extends Command {
  async run() {
    try {
      const {args, flags} = this.parse(InitCommand)

      if (FileSystemUtils.pathExists(path.join(flags.output, '_scf.json'))) {
        logger.info('The ouput folder is initialized!')
        logger.info('Aborting!')
        return
      }

      const source = new TemplateSource()
      const cache = new TemplateCache()
      const manager = new TemplateManager(source, cache)

      let templateConfig
      await spinner(`Getting template from ${args.Git_Hub_Repository}`, async () => {
        templateConfig = await manager.getTemplateFromSource(args.Git_Hub_Repository)
      })

      const initConfig = await manager.getPartial('_init', templateConfig.name, templateConfig.version)
      const parameters = await promptMissingParameters(flags.parameters, initConfig.config.parameters)

      await spinner('Running template initialization', async () => {
        const scafflater = new Scafflater()
        await scafflater.init(args.Git_Hub_Repository, parameters, flags.output)
      })

      logger.log('notice', 'Template initialized. Fell free to add partials. 🥳')
    } catch (error) {
      logger.error(error)
    }
  }
}

InitCommand.description = `Initializes the template in a output folder
...
`

InitCommand.args = [
  {name: 'Git_Hub_Repository', require: true},
]

InitCommand.flags = {
  output: flags.string({char: 'o', description: 'The output folder', default: './'}),
  parameters: flags.string({char: 'p', description: 'The parameters to init template', default: [], multiple: true}),
}

module.exports = InitCommand
