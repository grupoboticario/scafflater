const Annotator = require('../annotator/annotator')

class Appender {

  /**
  * @typedef {object} AppenderResult
  * @property {Context} context The context of generation. The processor can change context output to next processors.
  * @property {string} result The result string of proccess.
  * @property {string} unprocessed The string that was not processed by the processor. When the proccessor proccess the content and include it in the result, the default behavior is remove the content of the inputted string.
  */
  /** 
  * Process the input.
  * @param {Context} context The context of generation
  * @param {string} srcStr The string to be appended
  * @param {string} destStr The string where srcStr must be appended
  * @return {ProccessResult} The process result
  */
  append(context, srcStr, destStr) {
    const annotated = Annotator.annotate(context, srcStr)
    return {
      context,
      result: `${destStr}${annotated}` ,
      notAppended: ''
    }
  }

  /** 
  * Applies a processors pipeline to a content, given an specific context.
  * @param {Array<Processor>} appenders - Processors to be executed
  * @param {string} srcStr The string to be appended
  * @param {string} destStr The string where srcStr must be appended
  * @return {string} The pipeline append result
  */
  static runAppendersPipeline(appenders, context, srcStr, destStr){
    let appendContext = { ...context }

    for (const appender of appenders) {
      const appenderResult = appender.append(appendContext, srcStr, destStr)
      appendContext = appenderResult.context
      srcStr = appenderResult.notAppended,
      destStr = appenderResult.result
    }

    destStr = destStr.replace(/^(\s*\r?\n){2,}/gm,'\n')

    return destStr.trim()
  }
}

module.exports = Appender
