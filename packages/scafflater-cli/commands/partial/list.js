const { Command, flags } = require("@oclif/command");
const logger = require("scafflater/logger");
const chalk = require("chalk");
const ScafflaterOptions = require("scafflater/options");
const { Scafflater } = require("scafflater");
const Config = require("scafflater/scafflater-config/config");
const cliui = require("cliui");

class ListPartialCommand extends Command {
  async run() {
    try {
      const { flags: listFlags } = this.parse(ListPartialCommand);

      const options = new ScafflaterOptions({
        cacheStorage: listFlags.cache,
      });
      const scafflater = new Scafflater(options);

      const outputConfig = (await Config.fromLocalPath(listFlags.output))
        ?.config;

      if (!outputConfig || outputConfig.templates.length <= 0) {
        logger.info(`No initialized template found!`);
        logger.info(
          `Run ${chalk.bgBlack.yellowBright(
            "scafflater-cli init [TEMPLATE_ADDRESS]"
          )} to initialize one template.`
        );
        return;
      }

      const ui = cliui({ wrap: true });

      for (const template of outputConfig.templates) {
        const localTemplate = await scafflater.templateManager.getTemplate(
          template.name,
          template.version,
          template.source
        );

        ui.div({
          text: chalk.bold(`\n${template.name.toUpperCase()}`),
        });

        if (localTemplate.partials.length <= 0) {
          ui.div(`\t${chalk.italic("No partials available")}`);
        } else {
          ui.div(
            localTemplate.partials.reduce(
              (accumulator, currentTemplate) =>
                accumulator +
                `  ${currentTemplate.name}  \t${
                  currentTemplate.description ?? ""
                }\n`,
              ""
            )
          );
        }
      }
      logger.print(ui.toString());
    } catch (error) {
      logger.error(error);
    }
  }
}

ListPartialCommand.description = `Lists available partials in template
...
`;

const caches = ["homeDir", "tempDir"];
ListPartialCommand.flags = {
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
};

module.exports = ListPartialCommand;
