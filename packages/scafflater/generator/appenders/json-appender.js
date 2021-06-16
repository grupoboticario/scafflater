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

    let src = JSON.parse(srcStr)
    let dst = JSON.parse(destStr)

    src = merge(dst, src)

    return {
      context,
      result: JSON.stringify(src),
      notAppended: ''
    }
  }
}

module.exports = JsonAppender
