const Appender = require('./appender')
const merge = require('deepmerge')

class ReplaceAllAppender extends Appender {

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
        resolve({
          context,
          result: srcStr,
          notAppended: ''
        })
      } catch (error) {
        reject(error)
      }
    })
  }
}

module.exports = ReplaceAllAppender
