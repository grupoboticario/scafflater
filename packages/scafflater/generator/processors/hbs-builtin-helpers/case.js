/* eslint import/namespace: ['error', { allowComputed: true }] */
import * as changeCase from "change-case";
// eslint-disable-next-line import/no-unresolved
import { titleCase } from "title-case";
// eslint-disable-next-line import/no-unresolved
import { lowerCase } from "lower-case";

const customCases = {
  titleCase,
  lowerCase,
  upperCase: (str) => {
    return str.toUpperCase();
  },
  lowerCaseFirst: (str) => {
    return str.charAt(0).toLowerCase() + str.slice(1);
  },
  upperCaseFirst: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  noCaseAndTitle: (str) => {
    return titleCase(changeCase.noCase(str));
  },
  paramCase: (str) => {
    return changeCase.kebabCase(str);
  },
  headerCase: (str) => {
    return changeCase.trainCase(str);
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
