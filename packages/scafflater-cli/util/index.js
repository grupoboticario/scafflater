const ora = require("ora");
const chalk = require("chalk");
const path = require("path");
const Prompt = require("./prompt");
const fsUtil = require("scafflater/fs-util");
const logger = require("scafflater/logger");
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

const promptMissingParameters = async (parameterFlags, requireParameters) => {
  const flags = parseParametersFlags(parameterFlags);
  if (!requireParameters) return flags;

  const missingParameters = [];
  for (const rp of requireParameters) {
    if (!flags[rp.name]) missingParameters.push(rp);
  }

  const prompt =
    missingParameters.length > 0 ? await Prompt.prompt(missingParameters) : {};

  return { ...flags, ...prompt };
};

const spinner = async (message, f) => {
  const spinnerControl = ora(message).start();
  try {
    await f();
  } catch (error) {
    spinnerControl.stopAndPersist({ symbol: chalk.red("✖") });
    throw error;
  }
  spinnerControl.stopAndPersist({ symbol: chalk.green("✔") });
};

const listPartials = async (manager, config, output) => {
  const outputInfoPath = path.join(output, config.scfFileName);
  if (!fsUtil.pathExistsSync(outputInfoPath)) {
    logger.error("The template is not initialized!");
    logger.error(
      `Run ${chalk.bold("init")} to initialize the template at the ${chalk.bold(
        "output folder"
      )} before running partials!`
    );
    return;
  }

  const outputInfo = await fsUtil.readJSON(outputInfoPath);

  // Checking if the template is cached
  let cachePath = await manager.templateCache.getTemplatePath(
    outputInfo.template.name,
    outputInfo.template.version
  );
  if (!cachePath) {
    // Caching template
    await spinner(
      `Getting template from ${outputInfo.template.source.key}`,
      async () => {
        await manager.getTemplateFromSource(outputInfo.template.source.key);
      }
    );
    cachePath = await manager.templateCache.getTemplatePath(
      outputInfo.template.name,
      outputInfo.template.version
    );
    if (!cachePath) {
      logger.error(
        `Cannot get template ${chalk.bold(
          outputInfo.template.name
        )} (version ${chalk.bold(outputInfo.template.version)}) on ${
          outputInfo.template.source.key
        }`
      );
      return;
    }
  }

  const partials = await manager.listPartials(
    outputInfo.template.name,
    outputInfo.template.version
  );
  if (!partials || partials.length <= 0) {
    logger.error(
      `No partials available on template ${chalk.bold(
        outputInfo.template.name
      )} (version ${chalk.bold(outputInfo.template.version)})`
    );
    return;
  }

  return partials;
};

module.exports = {
  parseParametersFlags,
  promptMissingParameters,
  spinner,
  listPartials,
};
