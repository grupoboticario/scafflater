const { Command, flags } = require("@oclif/command");
const {
  Scafflater,
  TemplateSource,
  logger,
  Config,
  ScafflaterOptions,
  ScafflaterFileNotFoundError,
  ScafflaterError,
} = require("@scafflater/scafflater");
const {
  promptMissingParameters,
  parseParametersNames,
  spinner,
  parseKeyValueFlags,
} = require("../util");
const chalk = require("chalk");
const path = require("path");

class InitCommand extends Command {
  async run() {
    try {
      const { args: iniArgs, flags: initFlags } = this.parse(InitCommand);

      if (!iniArgs.source) {
        logger.error("The parameter 'source' is required.");
        logger.error("Use '--help' to details.");
        return;
      }

      const options = new ScafflaterOptions({
        cacheStorage: initFlags.cache,
        source: initFlags.templateSource,
        ...parseKeyValueFlags(initFlags.options),
      });
      const source = TemplateSource.resolveTemplateSourceFromSourceKey(
        options,
        iniArgs.source
      );
      options.source = source.source;
      options.mode = initFlags.debug ? "debug" : "prod";
      const scafflater = new Scafflater(options);

      let localTemplate;
      await spinner(`Getting template from ${iniArgs.source}`, async () => {
        localTemplate = await scafflater.templateManager.getTemplateFromSource(
          iniArgs.source,
          initFlags.version
        );
      });

      const outputConfigPath = path.resolve(initFlags.output, ".scafflater");
      let outputConfig;
      try {
        outputConfig = (await Config.fromLocalPath(outputConfigPath))?.config;
      } catch (error) {
        if (error instanceof ScafflaterFileNotFoundError) {
          outputConfig = new Config();
        } else {
          throw error;
        }
      }

      if (outputConfig.isInitialized(localTemplate.name)) {
        logger.info(`The template is already initialized!`);
        logger.info(
          `Run ${chalk.bgBlack.yellowBright(
            "scafflater-cli partial:list"
          )} to see available partials`
        );
        return;
      }

      const parameters = parseParametersNames(
        await promptMissingParameters(
          initFlags.parameters,
          localTemplate.parameters,
          outputConfig.globalParameters
        )
      );

      logger.info("Running template initialization");

      await scafflater.init(
        iniArgs.source,
        parameters,
        initFlags.version,
        initFlags.output
      );

      logger.log(
        "notice",
        "Template initialized. Fell free to run partials. 🥳"
      );
    } catch (error) {
      if (error instanceof ScafflaterError) {
        logger.info(error.message);
        return;
      }
      logger.error(error);
    }
  }
}

InitCommand.description = `Initializes the template in a output folder
...
`;

InitCommand.args = [{ name: "source", require: true }];

const caches = ["homeDir", "tempDir"];
const templatesSource = ["git", "githubClient", "isomorphicGit", "localFolder"];
InitCommand.flags = {
  output: flags.string({
    char: "O",
    description: "The output folder",
    default: "./",
  }),
  options: flags.string({
    char: "o",
    description: "Scafflater options. Pattern: <option-name>:<option-value>",
    default: [],
    multiple: true,
  }),
  cache: flags.string({
    char: "c",
    description: "The cache strategy",
    default: "homeDir",
    options: caches,
  }),
  templateSource: flags.string({
    char: "s",
    description: "Template source indicating how the template is fetched",
    default: "git",
    options: templatesSource,
  }),
  parameters: flags.string({
    char: "p",
    description:
      "The parameters to init template. Pattern: <parameter-name>:<parameter-value>",
    default: [],
    multiple: true,
  }),
  version: flags.string({
    char: "v",
    description: "The template version",
    default: "last",
  }),
  debug: flags.boolean({
    char: "d",
    description: "Debug mode execution",
    default: false,
  }),
};

module.exports = InitCommand;
