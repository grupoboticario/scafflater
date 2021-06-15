// TODO: MOVER PARA CONFIG
const HandlebarsProcessor = require('../processors/handlebars-processor')
const Processor = require('../processors/processor')
const processors = [ new HandlebarsProcessor() ]

class Annotator {
  static annotate(context, content){
    if (content.trim().length > 0) {
      if (context.config.annotate && context.config.annotationTemplate) {
        const anottationTemplate = context.config.annotationTemplate
        const anottationContext = { ...context, content}
        return Processor.runProcessorsPipeline(processors, anottationContext, anottationTemplate)
      }
    }
    return content
  }
}

module.exports = Annotator