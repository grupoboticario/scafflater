const ConfigProvider = require('../config-provider');
const Handlebars = require('handlebars')
const { exec } = require('child_process')

const maskParameters = (parameters, templateParameters) => {
  if (!templateParameters || !parameters)
    return parameters

  for (const p of templateParameters) {
    if (p.mask) {
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
const buildLineComment = (config, comment) => {
  return Handlebars.compile(config.lineCommentTemplate, { noEscape: true })({ comment })
}

const npmInstall = (packagePath) => {
  return new Promise((resolve, reject) => {
    exec(
      'npm install',
      { cwd: packagePath },
      (error, stdout, stderr) => {
        if (error) {
          reject(error.message)
          return
        }
        resolve(stdout);
      })
  })
}

module.exports = {
  maskParameters,
  buildLineComment,
  npmInstall
}
