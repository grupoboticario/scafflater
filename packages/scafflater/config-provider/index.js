
/**
 * @typedef {object} Config
 * @description The context used by generator to generate files and folder structure
 * @property {object} partial The partial info
 * @property {string} partialPath The folder path to partial
 * @property {object} parameters The parameters to generate the partial
 * @property {string} targetPath The path where generated files and folders will be saved
 * @property {object} template The template info
 * @property {string} templatePath The folder path to template
 * @property {object} config The scafflater configuration. This is provided by ConfigProvider
 */
class ConfigProvider {

  constructor() {
    this.singleLineComment = '#'
    this.startRegionMarker = '@scf-region'
    this.endRegionMarker = '@end-scf-region'
    this.annotate = true
    this.annotationTemplate = `{{{config.singleLineComment}}} {{{config.startRegionMarker}}}
{{{config.singleLineComment}}} This code was generated by scafflater
{{{config.singleLineComment}}} @template {{{template.name}}} (v{{{template.version}}})
{{{config.singleLineComment}}} @partial {{{partial.name}}}
{{#each parameters }}
{{{../template.config.singleLineComment}}} @{{{@key}}} {{{this}}} 
{{/each}}

{{{content}}}

{{{config.singleLineComment}}} {{{config.endRegionMarker}}}`
    
    this.processors = ['./processors/handlebars-processor']
    this.appenders = ['./appenders/region-appender', './appenders/appender']

    this.scfFileName = '_scf.json'
    this.partialsFolderName = '_partials'
    this.hooksFolderName = '_hooks'
    this.helpersFolderName = '_helpers'

  }


}

module.exports = ConfigProvider
