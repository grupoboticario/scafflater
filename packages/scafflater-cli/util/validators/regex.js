/**
 * Validates input against an regex
 * @param {object} question - Question used in inquirer
 * @param {string} input - The user entry
 * @return {ReturnValueDataTypeHere} Brief description of the returning value here.
 */
function validate(question, input) {
  if (!question.regex) return true;

  const re = `^${question.regex}$`;
  if (new RegExp(re, "g").test(input)) return true;

  return `${question.message}: The value '${input}' does note match the regex '/${question.regex}/g'`;
}

module.exports = validate;
