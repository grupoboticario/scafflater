const Appender = require('./appender')
const yaml = require('js-yaml');
const merge = require('deepmerge')

class YamlAppender extends Appender {
  
  /** 
  * Process the input.
  * @param {Context} context The context of generation
  * @param {string} srcStr The string to be appended
  * @param {string} destStr The string where srcStr must be appended
  * @return {ProcessResult} The process result
  */
  append(context, srcStr, destStr) {

    let src = yaml.load(srcStr)
    let dst = yaml.load(destStr)

    src = merge(dst, src)

    return {
      context,
      result: yaml.dump(src),
      notAppended: ''
    }
  }
}

module.exports = YamlAppender
