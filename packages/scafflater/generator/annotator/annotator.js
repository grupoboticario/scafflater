const { maskParameters } = require("../../util");
const HandlebarsProcessor = require("../processors/handlebars-processor");

class Annotator {
  static annotate(context, content) {
    const _ctx = { ...context };
    if (context.template) {
      _ctx.parameters = maskParameters(
        _ctx.parameters,
        context.template.parameters
      );
    }
    if (context.partial) {
      _ctx.parameters = maskParameters(
        _ctx.parameters,
        context.partial.parameters
      );
    }

    if (content.trim().length > 0) {
      if (context.options.annotate && context.options.annotationTemplate) {
        const annotationTemplate = context.options.annotationTemplate;
        const annotationContext = { ..._ctx, content };
        const processor = new HandlebarsProcessor();
        return processor.process(annotationContext, annotationTemplate).result;
      }
    }
    return content;
  }
}

module.exports = Annotator;
