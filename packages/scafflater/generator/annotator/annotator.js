const HandlebarsProcessor = require('../processors/handlebars-processor')
const processors = [ new HandlebarsProcessor() ]

class Annotator {
  static annotate(context, content){
    if (content.trim().length > 0) {
      if (context.config.annotate && context.config.annotationTemplate) {
        const annotationTemplate = context.config.annotationTemplate
        const annotationContext = { ...context, content}
        const processor = new HandlebarsProcessor()
        return processor.process(annotationContext, annotationTemplate).result
      }
    }
    return content
  }
}

module.exports = Annotator