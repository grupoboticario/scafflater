const { Command, flags } = require("@oclif/command");
const { Scafflater } = require("scafflater");
const TemplateSource = require("scafflater/template-source");
const { promptMissingParameters, spinner } = require("../util");
const logger = require("scafflater/logger");
const ScafflaterOptions = require("scafflater/options");
const Config = require("scafflater/scafflater-config/config");
const chalk = require("chalk");

class InitCommand extends Command {
  async run() {
    try {
      const { args: iniArgs, flags: initFlags } = this.parse(InitCommand);

      const config = new ScafflaterOptions({
        cacheStorage: initFlags.cache,
      });
      config.source = TemplateSource.resolveTemplateSourceFromSourceKey(
        config,
        iniArgs.source
      );
      const scafflater = new Scafflater(config);

      let localTemplate;
      await spinner(`Getting template from ${iniArgs.source}`, async () => {
        localTemplate = await scafflater.templateManager.getTemplateFromSource(
          iniArgs.source
        );
      });

      let outputConfig = (await Config.fromLocalPath(initFlags.output))?.config;
      if (!outputConfig) {
        outputConfig = new Config();
      }
      if (outputConfig.templates.find((t) => t.name === localTemplate.name)) {
        logger.info(`The template is already initialized!`);
        logger.info(
          `Run ${chalk.bgBlack.yellowBright(
            "scafflater-cli partial:list"
          )} to see available partials`
        );
        return;
      }

      const parameters = await promptMissingParameters(
        initFlags.parameters,
        localTemplate.parameters
      );

      await spinner("Running template initialization", async () => {
        await scafflater.init(iniArgs.source, parameters, initFlags.output);
      });

      logger.log(
        "notice",
        "Template initialized. Fell free to run partials. 🥳"
      );
    } catch (error) {
      logger.error(error);
    }
  }
}

InitCommand.description = `Initializes the template in a output folder
...
`;

InitCommand.args = [{ name: "source", require: true }];

const caches = ["homeDir", "tempDir"];
InitCommand.flags = {
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

module.exports = InitCommand;
