const ora = require("ora");
const chalk = require("chalk");
const Prompt = require("./prompt");
const { setProperty } = require("./dot-prop");
const {
  ParameterConfig,
} = require("@scafflater/scafflater/scafflater-config/parameter-config");
const {
  PersistedParameter,
} = require("@scafflater/scafflater/scafflater-config/persisted-parameter");

const parseParametersFlags = (parameters) => {
  const result = {};

  parameters.forEach((param) => {
    const m = /(?<name>.+)(?::)(?<value>.+)/g.exec(param);
    if (m.length <= 0)
      throw new Error(
        "The parameters is not in the expected pattern: <parameter-name>:<parameter-value>"
      );

    result[m.groups.name] = m.groups.value;
  });

  return result;
};

/**
 *
 * @param {string[]} parameterFlags Parameters received as parameters using command flags
 * @param {ParameterConfig[]} requiredParameters Required parameters
 * @param {?PersistedParameter[]} globalParameters Persisted global parameters
 * @param {?PersistedParameter[]} templateParameters Persisted template parameters
 * @returns {object} An object with all parameters prompted and loaded parameters
 */
const promptMissingParameters = async (
  parameterFlags,
  requiredParameters,
  globalParameters = [],
  templateParameters = []
) => {
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
};

const parseParametersNames = (parameters) => {
  const result = {};
  for (const parameter in parameters) {
    setProperty(result, parameter, parameters[parameter]);
  }

  return result;
};

const spinner = async (message, f) => {
  const spinnerControl = ora(message).start();
  try {
    await f(spinnerControl);
  } catch (error) {
    spinnerControl.stopAndPersist({ symbol: chalk.red("✖") });
    throw error;
  }
  spinnerControl.stopAndPersist({ symbol: chalk.green("✔") });
};

module.exports = {
  parseParametersFlags,
  promptMissingParameters,
  spinner,
  parseParametersNames,
};
