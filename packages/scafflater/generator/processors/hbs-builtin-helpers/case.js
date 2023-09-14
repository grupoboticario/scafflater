import changeCase from "change-case";
import { titleCase } from "title-case";
import { lowerCase } from "lower-case";
import { upperCase } from "upper-case";
import { lowerCaseFirst } from "lower-case-first";
import { upperCaseFirst } from "upper-case-first";

changeCase.titleCase = titleCase;
changeCase.lowerCase = lowerCase;
changeCase.upperCase = upperCase;
changeCase.lowerCaseFirst = lowerCaseFirst;
changeCase.upperCaseFirst = upperCaseFirst;

changeCase.noCaseAndTitle = (str) => {
  return titleCase(changeCase.noCase(str));
};

export default (op, string) => {
  if (!changeCase[op] || typeof changeCase[op] !== "function") {
    throw new Error(`${op} is not a valid case operation`);
  }

  return changeCase[op](string);
};
