/* eslint import/namespace: ['error', { allowComputed: true }] */
import * as changeCase from "change-case";
import { titleCase } from "title-case";
import { lowerCase } from "lower-case";
import { upperCase } from "upper-case";
import { lowerCaseFirst } from "lower-case-first";
import { upperCaseFirst } from "upper-case-first";

const customCases = {
  titleCase,
  lowerCase,
  upperCase,
  lowerCaseFirst,
  upperCaseFirst,
  noCaseAndTitle: (str) => {
    return titleCase(changeCase.noCase(str));
  },
};

export default (op, string) => {
  if (changeCase[op] && typeof changeCase[op] === "function") {
    return changeCase[op](string);
  }
  if (customCases[op] && typeof customCases[op] === "function") {
    return customCases[op](string);
  }

  throw new Error(`${op} is not a valid case operation`);
};
