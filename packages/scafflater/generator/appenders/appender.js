const Annotator = require("../annotator/annotator");
const { EOL } = require("os");

class Appender {
  /**
   * @typedef {object} AppenderResult
   * @property {object} context The context of generation. The processor can change context output to next processors.
   * @property {string} result The result string of process.
   * @property {string} unprocessed The string that was not processed by the processor. When the processor process the content and include it in the result, the default behavior is remove the content of the inputted string.
   */
  /**
   * Process the input.
   *
   * @param {object} context The context of generation
   * @param {string} srcStr The string to be appended
   * @param {string} destStr The string where srcStr must be appended
   * @returns {Promise<object>} The process result
   */
  append(context, srcStr, destStr) {
    const annotated = Annotator.annotate(context, srcStr);
    let result = destStr;

    if (srcStr && srcStr.trim().length > 0) {
      result =
        context.options.appendStrategy === "append"
          ? `${destStr}${EOL}${EOL}${annotated}`
          : annotated;
    }

    return Promise.resolve({
      context,
      result,
      notAppended: "",
    });
  }

  /**
   * Applies a processors pipeline to a content, given an specific context.
   *
   * @param {Array<object>} appenders - Processors to be executed
   * @param {object} context The context of generation. The processor can change context output to next processors.
   * @param {string} srcStr The string to be appended
   * @param {string} destStr The string where srcStr must be appended
   * @returns {Promise<string>} The pipeline append result
   */
  static async runAppendersPipeline(appenders, context, srcStr, destStr) {
    let appendContext = { ...context };

    for (const appender of appenders) {
      const appenderResult = await appender.append(
        appendContext,
        srcStr,
        destStr
      );
      appendContext = appenderResult.context;
      srcStr = appenderResult.notAppended;
      destStr = appenderResult.result;
    }

    destStr = destStr.replace(/^(\s*\r?\n){2,}/gm, "\n");

    return Promise.resolve(destStr.trim());
  }
}

module.exports = Appender;
