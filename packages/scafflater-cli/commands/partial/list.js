import { Command, flags } from "@oclif/command";
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
  async run() {
    try {
      const { flags: listFlags } = this.parse(ListPartialCommand);

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
        const localTemplate = await scafflater.templateManager.getTemplate(
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

ListPartialCommand.description = `Lists available partials in template
...
`;

const caches = ["homeDir", "tempDir"];
const templatesSource = ["git", "githubClient", "isomorphicGit", "localFolder"];
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
  templateSource: flags.string({
    char: "s",
    description: "Template source indicating how the template is fetched",
    default: "git",
    options: templatesSource,
  }),
};
