const inquirer = require("inquirer");
const regexValidate = require("./validators/regex");

/**
 * Class to prompt user
 */
class Prompt {
  /**
   * Prompts the user values the questions in config.prompt.
   *
   * @param {object[]} questions The questions to be collected from hte user
   * @param {object} answers - Contains values of already answered questions. Inquirer will avoid asking answers already provided here. Defaults {}.
   * @returns {Promise<object>} Answers.
   */
  static async prompt(questions, answers = {}) {
    return new Promise((resolve, reject) => {
      try {
        questions = questions.map((q) => {
          if (!q.regex) return q;

          return {
            ...q,
            validate: (input) => {
              return regexValidate(q, input);
            },
          };
        });

        resolve(inquirer.prompt(questions, answers));
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = Prompt;
