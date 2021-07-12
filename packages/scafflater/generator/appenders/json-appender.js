const Appender = require('./appender')
const merge = require('deepmerge')

class JsonAppender extends Appender {

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
        let src = JSON.parse(srcStr)
        let dst = JSON.parse(destStr)

        src = merge(dst, src)

        resolve({
          context,
          result: JSON.stringify(src),
          notAppended: ''
        })
      } catch (error) {
        reject(error)
      }
    })
  }
}

module.exports = JsonAppender
