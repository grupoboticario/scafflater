const {Command, flags} = require('@oclif/command')
const TemplateManager = require('scafflater/template-manager')
const {promptMissingParameters, spinner} = require('../../util')
const fsUtil = require('scafflater/fs-util')
const path = require('path')
const logger = require('scafflater/logger')
const chalk = require('chalk')
const ConfigProvider = require('scafflater/config-provider')

class ListPartialCommand extends Command {
  async run() {
    try {
      const {flags: cmdFlags} = this.parse(ListPartialCommand)
      const outputInfoPath = path.join(cmdFlags.output, '.scafflater')
      if (!fsUtil.pathExistsSync(outputInfoPath)) {
        logger.error('The template is not initialized!')
        logger.error(`Run ${chalk.bold('init')} to initialize the template at the ${chalk.bold('output folder')} before working with partials!`)
        return
      }

      const config = {  
        ...new ConfigProvider(), 
        ...{ 
          cacheStorage: 'homeDir' 
        }
      }

      const manager = new TemplateManager(config)

      const outputInfo = fsUtil.readJSONSync(outputInfoPath)

      // Checking if the template is cached
      let cachePath = await manager.templateCache.getTemplatePath(outputInfo.template.name, outputInfo.template.version)
      if (!cachePath) {
        // Caching template
        await spinner(`Getting template from ${outputInfo.template.source.key}`, async () => {
          await manager.getTemplateFromSource(outputInfo.template.source.key)
        })
        cachePath = await manager.templateCache.getTemplatePath(outputInfo.template.name, outputInfo.template.version)
        if (!cachePath) {
          logger.error(`Cannot get template ${chalk.bold(outputInfo.template.name)} (version ${chalk.bold(outputInfo.template.version)}) on ${outputInfo.template.source.key}`)
          return
        }
      }

      let partials = await manager.listPartials(outputInfo.template.name, outputInfo.template.version)
      if (!partials) {
        logger.error(`No partials available on template ${chalk.bold(outputInfo.template.name)} (version ${chalk.bold(outputInfo.template.version)})`)
        return
      }

      console.log(chalk.bold('\nPARTIALS'))
      partials.filter(p => p.config.type === 'partial').forEach(p => console.log(`  ${p.config.name}\t${p.config.description ?? ''}`))
      console.log('')   

    } catch (error) {
      logger.error(error)
    }
  }
}

ListPartialCommand.description = `Lists available partials in template
...
`

ListPartialCommand.flags = {
  output: flags.string({char: 'o', description: 'The output folder', default: './'})
}

module.exports = ListPartialCommand
