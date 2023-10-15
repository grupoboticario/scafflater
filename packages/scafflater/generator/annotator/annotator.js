import { maskParameters } from "../../util/index.js";
import HandlebarsProcessor from "../processors/handlebars-processor.js";
import { resolve } from "path";

export default class Annotator {
  static async annotate(context, content) {
    const _ctx = { ...context };
    if (context.template) {
      _ctx.parameters = maskParameters(
        _ctx.parameters,
        context.template.parameters,
      );
    }
    if (context.partial) {
      _ctx.parameters = maskParameters(
        _ctx.parameters,
        context.partial.parameters,
      );
    }

    if (content.trim().length > 0) {
      if (context.options.annotate && context.options.annotationTemplate) {
        const annotationTemplate = context.options.annotationTemplate;
        const annotationContext = { ..._ctx, content };
        const processor = new HandlebarsProcessor();
        await HandlebarsProcessor.loadHelpersFolder(
          resolve(context.templatePath, context.helpersPath),
        );
        return Promise.resolve(
          (await processor.process(annotationContext, annotationTemplate))
            .result,
        );
      }
    }
    return Promise.resolve(content);
  }
}
