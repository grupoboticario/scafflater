const changeCase = require("change-case");
const { titleCase } = require("title-case");
const { lowerCase } = require("lower-case");
const { upperCase } = require("upper-case");
const { lowerCaseFirst } = require("lower-case-first");
const { upperCaseFirst } = require("upper-case-first");

changeCase.titleCase = titleCase;
changeCase.lowerCase = lowerCase;
changeCase.upperCase = upperCase;
changeCase.lowerCaseFirst = lowerCaseFirst;
changeCase.upperCaseFirst = upperCaseFirst;

changeCase.noCaseAndTitle = (str) => {
  return titleCase(changeCase.noCase(str));
};

module.exports = (op, string) => {
  if (!changeCase[op] || typeof changeCase[op] !== "function") {
    throw new Error(`${op} is not a valid case operation`);
  }

  return changeCase[op](string);
};
