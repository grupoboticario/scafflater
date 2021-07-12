const Annotator = require('../annotator/annotator')
const { EOL } = require('os')

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
  * @return {ProcessResult} The process result
  */
  append(context, srcStr, destStr) {
    return new Promise((resolve, reject) => {
      try {
        const annotated = Annotator.annotate(context, srcStr)
        let result = destStr

        if (srcStr && srcStr.trim().length > 0) {
          result = context.config.appendStrategy === 'append' ?
            `${destStr}${EOL}${EOL}${annotated}` :
            annotated
        }

        resolve({
          context,
          result,
          notAppended: ''
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  /** 
  * Applies a processors pipeline to a content, given an specific context.
  * @param {Array<Processor>} appenders - Processors to be executed
  * @param {string} srcStr The string to be appended
  * @param {string} destStr The string where srcStr must be appended
  * @return {Promise<string>} The pipeline append result
  */
  static runAppendersPipeline(appenders, context, srcStr, destStr) {
    return new Promise(async (resolve, reject) => {
      try {
        let appendContext = { ...context }

        for (const appender of appenders) {
          const appenderResult = await appender.append(appendContext, srcStr, destStr)
          appendContext = appenderResult.context
          srcStr = appenderResult.notAppended
          destStr = appenderResult.result
        }

        destStr = destStr.replace(/^(\s*\r?\n){2,}/gm, '\n')

        resolve(destStr.trim())
      } catch (e) {
        reject(e)
      }
    })
  }
}

module.exports = Appender
