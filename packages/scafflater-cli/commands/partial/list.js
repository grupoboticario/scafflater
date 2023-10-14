import { Command, Flags } from "@oclif/core";
import chalk from "chalk";
import {
  Scafflater,
  ScafflaterOptions,
  logger,
  Config,
} from "@scafflater/scafflater";
import cliui from "cliui";
import path from "path";

export default class ListPartialCommand extends Command {
  static description = `Lists available partials in template
...
`;

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
  };

  async run() {
    try {
      const { flags: listFlags } = await this.parse(ListPartialCommand);

      const options = new ScafflaterOptions({
        cacheStorage: listFlags.cache,
        source: listFlags.templateSource,
      });
      const scafflater = new Scafflater(options);

      const outputConfig = (
        await Config.fromLocalPath(
          path.resolve(listFlags.output, ".scafflater")
        )
      )?.config;

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
        const templateManager = await scafflater.getTemplateManager();
        const localTemplate = await templateManager.getTemplate(
          template.name,
          template.version,
          template.source
        );

        ui.div({
          text: chalk.bold(`TEMPLATE`),
          padding: [1, 0, 0, 0],
        });
        ui.div({
          text: `${template.name}`,
          padding: [0, 0, 0, 2],
        });

        ui.div({
          text: chalk.bold(`PARTIALS`),
          padding: [1, 0, 0, 0],
        });
        if (localTemplate.partials.length <= 0) {
          ui.div(`\t${chalk.italic("No partials available")}`);
        } else {
          ui.div(
            localTemplate.partials.reduce(
              (accumulator, currentTemplate) =>
                accumulator +
                `  ${currentTemplate.name}  \t${
                  chalk.gray(currentTemplate.description) ?? ""
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
