const util = require('../../../util')
const handlebarsProcessor = new (require('../handlebars-processor'))()

module.exports = (context, options) => {
  return util.buildLineComment(options.data.root.config, options.fn(context))
}