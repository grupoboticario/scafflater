const ConfigProvider = require('../config-provider');
const HandlebarsProcessor = require('../generator/processors/handlebars-processor')

const maskParameters = (parameters, templateParameters) => {
  if(!templateParameters || !parameters)
    return parameters

  for (const p of templateParameters) {
    if(p.mask){
      parameters[p.name] = '******'
    }
  }

  return parameters;
}

/** 
* Builds a line comment based on config.lineCommentTemplate.
* @param {ConfigProvider} config - The configuration
* @param {string} comment - The comment content
* @return {string} The comment 
*/
const buildLineComment = (config, comment) =>{
  const processor = new HandlebarsProcessor()

  return processor.process({ comment }, config.lineCommentTemplate).result
}

module.exports = {
  maskParameters,
  buildLineComment
}
