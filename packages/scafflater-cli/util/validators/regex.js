/**
 * Validates input against an regex
 * @param {object} question - Question used in inquirer
 * @param {string} input - The user entry
 * @returns {(boolean|string)} True if the input is valid or if the regex is not informed.
 */
export default function validate(question, input) {
  if (!question.regex) return true;

  const re = `^${question.regex}$`;
  if (new RegExp(re, "g").test(input)) return true;

  return `${question.message}: The value '${input}' does note match the regex '/${question.regex}/g'`;
}
