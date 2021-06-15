const inquirer = require('inquirer')
/**
* Class to prompt user
*/
class Prompt {
  constructor(config) {
    this.config = config
  }

  /**
  * Prompts the user values the questions in config.prompt.
  * @param {object} answers - Contains values of already answered questions. Inquirer will avoid asking answers already provided here. Defaults {}.
  * @return {object} Answers.
  */
  async prompt(answers = {}) {
    return inquirer.prompt(this.config.prompt, answers)
  }
}

module.exports = Prompt
