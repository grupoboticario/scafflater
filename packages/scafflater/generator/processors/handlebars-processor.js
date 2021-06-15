const Processor = require('./processor')
const Handlebars = require('handlebars')

/**
* Compile and apply the handlebar js on input
* @extends Processor
*/
class HandlebarsProcessor extends Processor {

  process(context, input) {
    const parentResult = super.process(context, input)
    return {
      context,
      result: Handlebars.compile(parentResult.result)(parentResult.context)
    }
  }
}

module.exports = HandlebarsProcessor