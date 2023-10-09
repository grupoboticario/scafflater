import { Command, Flags, Args } from "@oclif/core";
import {
  Scafflater,
  TemplateSource,
  logger,
  Config,
  ScafflaterOptions,
  ScafflaterFileNotFoundError,
  ScafflaterError,
} from "@scafflater/scafflater";
import {
  promptMissingParameters,
  parseParametersNames,
  spinner,
} from "../util/index.js";
import chalk from "chalk";
import path from "path";

export default class InitCommand extends Command {
  static description = `Initializes the template in a output folder
...
`;

  static args = {
    source: Args.string({
      description: "The template source",
      required: true,
    }),
  };

  static caches = ["homeDir", "tempDir"];
  static templatesSource = [
    "git",
    "githubClient",
    "isomorphicGit",
    "localFolder",
  ];
  static flags = {
    output: Flags.string({
      char: "o",
      description: "The output folder",
      default: "./",
    }),
    cache: Flags.string({
      char: "c",
      description: "The cache strategy",
      default: "homeDir",
      options: this.caches,
    }),
    templateSource: Flags.string({
      char: "s",
      description: "Template source indicating how the template is fetched",
      default: "git",
      options: this.templatesSource,
    }),
    parameters: Flags.string({
      char: "p",
      description: "The parameters to init template",
      default: [],
      multiple: true,
    }),
    version: Flags.string({
      char: "v",
      description: "The template version",
      default: "last",
    }),
    debug: Flags.boolean({
      char: "d",
      description: "Debug mode execution",
      default: false,
    }),
  };

  async run() {
    try {
      const { args: iniArgs, flags: initFlags } = await this.parse(InitCommand);

      const config = new ScafflaterOptions({
        cacheStorage: initFlags.cache,
        source: initFlags.templateSource,
      });
      const source = await TemplateSource.resolveTemplateSourceFromSourceKey(
        config,
        iniArgs.source
      );
      config.source = source.source;
      config.mode = initFlags.debug ? "debug" : "prod";
      const scafflater = new Scafflater(config);

      let localTemplate;
      await spinner(`Getting template from ${iniArgs.source}`, async () => {
        const templateManager = await scafflater.getTemplateManager();
        localTemplate = await templateManager.getTemplateFromSource(
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
