const {Command, flags} = require('@oclif/command')
const TemplateSource = require('scafflater/template-source')
const Scafflater = require('scafflater')
const TemplateManager = require('scafflater/template-manager')
const TemplateCache = require('scafflater/template-cache')
const {promptMissingParameters, spinner} = require('../util')
const fsUtil = require('scafflater/fs-util')
const path = require('path')
const logger = require('scafflater/logger')
const OptionsProvider = require('scafflater/options-provider')

class InitCommand extends Command {
  async run() {
    try {
      const {args: iniArgs, flags: initFlags} = this.parse(InitCommand)

      const config = {  
        ...new OptionsProvider(), 
        ...{ 
          cacheStorage: initFlags.cache 
        }
      }

      if (fsUtil.pathExistsSync(path.join(initFlags.output, config.scfFileName))) {
        logger.info('The output folder is initialized!')
        logger.info('Aborting!')
        return
      }
      const manager = new TemplateManager(config)

      let templateConfig
      await spinner(`Getting template from ${iniArgs.Git_Hub_Repository}`, async () => {
        templateConfig = await manager.getTemplateFromSource(iniArgs.Git_Hub_Repository)
      })

      const parameters = await promptMissingParameters(initFlags.parameters, templateConfig.parameters)

      await spinner('Running template initialization', async () => {
        const scafflater = new Scafflater(config, manager)
        await scafflater.init(iniArgs.Git_Hub_Repository, parameters, initFlags.output)
      })

      logger.log('notice', 'Template initialized. Fell free to run partials. 🥳')
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

const caches = ['homeDir', 'tempDir']
InitCommand.flags = {
  output: flags.string({char: 'o', description: 'The output folder', default: './'}),
  cache: flags.string({ char: 'c', description: 'The cache strategy', default: 'homeDir', options: caches }),
  parameters: flags.string({char: 'p', description: 'The parameters to init template', default: [], multiple: true}),
}

module.exports = InitCommand
