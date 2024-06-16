import ora from "ora";
import chalk from "chalk";
import Prompt from "./prompt.js";
import { setProperty } from "./dot-prop.js";
import { ParameterConfig, PersistedParameter } from "@scafflater/scafflater";

/**
 *
 * @param arrayIndexes
 * @param name
 */
function parseUnindexedArray(arrayIndexes, name) {
  if (name.endsWith("[]")) {
    name = name.slice(0, -2);
    if (arrayIndexes[name] === undefined) arrayIndexes[name] = 0;
    else arrayIndexes[name] += 1;
    return `${name}[${arrayIndexes[name]}]`;
  }
  return name;
}

/**
 * @param parameters
 */
export function parseParametersFlags(parameters) {
  const result = {};

  const arrayIndexes = {};
  parameters.forEach((param) => {
    const m = /(?<name>[^:]+)(?::)(?<value>.+)/g.exec(param);
    if (m.length <= 0)
      throw new Error(
        "The parameters is not in the expected pattern: <parameter-name>:<parameter-value>",
      );

    // build an object if the parameter name is a dot separated name
    const nameSplit = m.groups.name.split(".");
    let current = result;
    for (let i = 0; i < nameSplit.length - 1; i++) {
      const name = parseUnindexedArray(arrayIndexes, nameSplit[i]);
      if (!current[name]) current[name] = {};
      current = current[name];
    }

    const name = parseUnindexedArray(
      arrayIndexes,
      nameSplit[nameSplit.length - 1],
    );
    current[name] = m.groups.value;
  });

  return result;
}

/**
 *
 * @param {string[]} parameterFlags Parameters received as parameters using command flags
 * @param {ParameterConfig[]} requiredParameters Required parameters
 * @param {?PersistedParameter[]} globalParameters Persisted global parameters
 * @param {?PersistedParameter[]} templateParameters Persisted template parameters
 * @returns {object} An object with all parameters prompted and loaded parameters
 */
export async function promptMissingParameters(
  parameterFlags,
  requiredParameters,
  globalParameters = [],
  templateParameters = [],
) {
  const flags = parseParametersFlags(parameterFlags);
  if (!requiredParameters) return flags;

  const missingParameters = [];
  for (const rp of requiredParameters) {
    if (
      !flags[rp.name] &&
      globalParameters.findIndex((p) => p.name === rp.name) < 0 &&
      templateParameters.findIndex((p) => p.name === rp.name) < 0
    )
      missingParameters.push(rp);
  }

  const prompt =
    missingParameters.length > 0 ? await Prompt.prompt(missingParameters) : {};

  return {
    ...PersistedParameter.reduceParameters(globalParameters),
    ...PersistedParameter.reduceParameters(templateParameters),
    ...flags,
    ...prompt,
  };
}
/**
 * @param parameters
 */
export function parseParametersNames(parameters) {
  const result = {};
  for (const parameter in parameters) {
    setProperty(result, parameter, parameters[parameter]);
  }

  return result;
}
/**
 * @param message
 * @param f
 */
export async function spinner(message, f) {
  const spinnerControl = ora(message).start();
  try {
    await f(spinnerControl);
  } catch (error) {
    spinnerControl.stopAndPersist({ symbol: chalk.red("✖") });
    throw error;
  }
  spinnerControl.stopAndPersist({ symbol: chalk.green("✔") });
}
