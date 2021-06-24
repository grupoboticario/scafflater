const TemplateSource = require('./')
const GitUtil = require('../git-util')
const fsUtil = require('../fs-util')
const path = require('path')

const defaultConfig = {
  source: 'github',
  sources: {
    github: './git-template-source',
  },
  github: {
    baseUrlApi: 'https://api.github.com',
    baseUrl: 'https://github.com',
  },
}

class GitTemplateSource extends TemplateSource {
  /**
  * Template Source constructor.
  * @param {?object} config - Scafflater configuration. If null, will get the default configuration.
  */
  constructor(config = {}) {
    config = { ...defaultConfig, ...config }
    super(config)
  }

  /**
  * Gets the template and copies it in a local folder.
  * @param {string} sourceKey - The source key (<OWNER>/<REPOSITORY>) of template.
  * @param {?string} outputDir - Folder where template must be copied. If null, a temp folder will be used.
  * @return {object.path} Path where the template was copied.
  * @return {object.config} The template config.
  */
  async getTemplate(sourceKey, outputDir = null) {
    return new Promise(async (resolve, reject) => {
      const out = outputDir ? outputDir : await fsUtil.getTempFolder()
      await GitUtil.clone(sourceKey, out)
      const config = await fsUtil.readJSON(path.join(out, '_scf.json'))

      // TODO: Validate template configuration

      resolve({
        path: out,
        config: {
          name: config.name,
          version: config.version,
          source: {
            name: this.config.source,
            key: sourceKey,
            github: {
              baseUrl: this.config.github.baseUrl,
              baseUrlApi: this.config.github.baseUrlApi,
            },
          },
        },
      })
    })
  }
}

module.exports = GitTemplateSource
