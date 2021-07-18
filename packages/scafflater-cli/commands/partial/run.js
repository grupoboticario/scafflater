const { Command, flags } = require("@oclif/command");
const Scafflater = require("scafflater");
const {
  promptMissingParameters,
  spinner,
  listPartials,
} = require("../../util");
const fsUtil = require("scafflater/fs-util");
const path = require("path");
const logger = require("scafflater/logger");
const chalk = require("chalk");
const inquirer = require("inquirer");
const OptionsProvider = require("scafflater/options-provider");

class RunPartialCommand extends Command {
  async run() {
    try {
      const { args: runArgs, flags: runFlags } = this.parse(RunPartialCommand);

      const config = {
        ...new OptionsProvider(),
        ...{
          cacheStorage: runFlags.cache,
        },
      };
      const outputInfoPath = path.join(runFlags.output, config.scfFileName);
      const outputInfo = await fsUtil.readJSON(outputInfoPath);
      config.source = outputInfo.template.source.name;

      const scafflater = new Scafflater(config);

      const partials = await listPartials(
        scafflater.templateManager,
        config,
        runFlags.output
      );
      if (!partials || partials.length <= 0) {
        return;
      }

      let partial = null;
      if (runArgs.PARTIAL_NAME && runArgs.PARTIAL_NAME.length > 0) {
        // Validating partialName flag
        partial = partials.find((p) => {
          return p.config.name === runArgs.PARTIAL_NAME;
        });
        if (!partial) {
          logger.error(
            `The partial '${chalk.bold(
              runArgs.PARTIAL_NAME
            )}' is not available at template '${chalk.bold(
              outputInfo.template.name
            )}' (version ${chalk.bold(outputInfo.template.version)})`
          );
          logger.error(
            `Run '${chalk.bold(
              "scafflater-cli partial:list"
            )}' to see the partials for this template`
          );
          return;
        }
      } else {
        const prompt = await inquirer.prompt([
          {
            type: "rawlist",
            name: "partialName",
            message: "Which partial do you want to?",
            choices: partials
              .filter((p) => p.config.type === "partial")
              .map((p) => p.config.name),
          },
        ]);
        partial = partials.find((p) => {
          return p.config.name === prompt.partialName;
        });
      }

      const parameters = await promptMissingParameters(
        runFlags.parameters,
        partial.config.parameters
      );

      await spinner("Running partial template", async () => {
        await scafflater.runPartial(
          partial.config.name,
          parameters,
          runFlags.output
        );
      });

      logger.log("notice", "Partial results appended to output!");
    } catch (error) {
      logger.error(error);
    }
  }
}

RunPartialCommand.description = `Runs a partial and append the result to the output folder
...
`;

RunPartialCommand.args = [
  {
    name: "PARTIAL_NAME",
    description: "The partial name",
    default: null,
    require: false,
  },
];

const caches = ["homeDir", "tempDir"];
RunPartialCommand.flags = {
  output: flags.string({
    char: "o",
    description: "The output folder",
    default: "./",
  }),
  cache: flags.string({
    char: "c",
    description: "The cache strategy",
    default: "homeDir",
    options: caches,
  }),
  parameters: flags.string({
    char: "p",
    description: "The parameters to init template",
    default: [],
    multiple: true,
  }),
};

module.exports = RunPartialCommand;
