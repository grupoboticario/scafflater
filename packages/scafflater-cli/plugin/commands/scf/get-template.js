const {Command} = require('@oclif/command')
const TemplateManager = require('scafflater/template-manager')

class GetTemplate extends Command {
  async run() {
    const {args} = this.parse(GetTemplate)
    await TemplateManager.getTemplateFromRemote(args.repoUrl)
  }
}

GetTemplate.description = 'Gets template from git repository'

GetTemplate.args = [
  {name: 'repoUrl', description: 'Template Github repository url', required: true},
]

module.exports = GetTemplate
