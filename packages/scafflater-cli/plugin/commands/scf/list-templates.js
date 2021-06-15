/* eslint-disable no-console */
const {Command} = require('@oclif/command')
const TemplateManager = require('scafflater/template-manager')
const chalk = require('chalk')
const chalkTable = require('chalk-table')

class ListTemplate extends Command {
  async run() {
    const templates = await TemplateManager.listTemplates()

    if (templates.length <= 0) {
      console.warn(chalk.black.bgYellow('You do not have templates yet'))
      return
    }

    var versions = []
    templates.forEach(template => {
      template.versions.forEach(version => {
        const inUse = version.inUse ? '* ' : '  '
        versions.push({inUse, template: template.name, version: version.version})
      })
    })

    const options = {
      leftPad: 2,
      columns: [
        {field: 'inUse',  name: chalk.greenBright('')},
        {field: 'template',  name: chalk.greenBright('Template Name')},
        {field: 'version', name: chalk.greenBright('Template Version')},
      ],
    }

    const table = chalkTable(options, versions)

    console.log(table)
  }
}

ListTemplate.description = 'Gets template from git repository'

module.exports = ListTemplate
