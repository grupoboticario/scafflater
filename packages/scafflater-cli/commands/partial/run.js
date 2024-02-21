import { Command, Flags, Args } from "@oclif/core";
import {
  Scafflater,
  ScafflaterOptions,
  logger,
  Config,
  LocalTemplate,
  LocalPartial,
} from "@scafflater/scafflater";
import {
  promptMissingParameters,
  parseParametersNames,
  spinner,
} from "../../util/index.js";
import chalk from "chalk";
import path from "path";
import inquirer from "inquirer";

/**
 * Try to load cached templates and load from source if it is not available
 * @param {Config} outputConfig The output config
 * @param {Scafflater} scafflater The scafflater instance
 * @returns {Promise<LocalTemplate[]>} A list of local template
 */
const loadTemplates = async (outputConfig, scafflater) => {
  /**
   * @type { LocalTemplate[]}
   */
  const localTemplates = [];

  await spinner(`Getting templates`, async (spinnerControl) => {
    for (const ranTemplate of outputConfig.templates) {
      spinnerControl.text = `Getting ${chalk.bold(
        ranTemplate.name,
      )} from ${chalk.underline(ranTemplate.source.key)}`;
      const templateManager = await scafflater.getTemplateManager();
      let localTemplate = await templateManager.templateCache.getTemplate(
        ranTemplate.name,
        ranTemplate.version,
      );
      if (!localTemplate) {
        localTemplate = await templateManager.getTemplateFromSource(
          ranTemplate.source.key,
        );
      }
      if (!localTemplate) {
        throw new Error(
          `Could not get template '${chalk.bold(
            ranTemplate.name,
          )}' from ${chalk.underline(ranTemplate.key)}`,
        );
      }

      localTemplates.push(localTemplate);
    }
  });

  return Promise.resolve(localTemplates);
};

/**
 * A class to relate partial with templates.
 * @class LocalPartialTemplate
 * @augments LocalPartial
 */
class LocalPartialTemplate extends LocalPartial {
  /**
   * @param {string} templateName The template name
   * @param {LocalPartial} localPartial the local partial
   */
  constructor(templateName, localPartial) {
    super();
    Object.assign(this, localPartial);
    this.templateName = templateName;
  }
}

export default class RunPartialCommand extends Command {
  static description = `Runs a partial and append the result to the output folder
...
`;

  static args = {
    PARTIAL_NAME: Args.string({
      description: "The partial name",
      default: null,
      require: false,
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
    template: Flags.string({
      char: "t",
      description: "The template which contains the partial to be run",
    }),
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
    parameters: Flags.string({
      char: "p",
      description: "The parameters to init template",
      default: [],
      multiple: true,
    }),
    templateSource: Flags.string({
      char: "s",
      description: "Template source indicating how the template is fetched",
      default: "git",
      options: this.templatesSource,
    }),
    debug: Flags.boolean({
      char: "d",
      description: "Debug mode execution",
      default: false,
    }),
  };

  async run() {
    try {
      const { args: runArgs, flags: runFlags } =
        await this.parse(RunPartialCommand);

      const options = new ScafflaterOptions({
        cacheStorage: runFlags.cache,
        source: runFlags.templateSource,
      });
      options.mode = runFlags.debug ? "debug" : "prod";
      const scafflater = new Scafflater(options);

      // Getting info from target path
      const outputConfig = (
        await Config.fromLocalPath(path.resolve(runFlags.output, ".scafflater"))
      )?.config;
      if (!outputConfig || outputConfig.templates.length <= 0) {
        logger.info(`No initialized template found!`);
        logger.info(
          `Run ${chalk.bgBlack.yellowBright(
            "scafflater-cli init [TEMPLATE_ADDRESS]",
          )} to initialize one template.`,
        );
        return;
      }

      // Checking and loading templates
      /**
       * @type {LocalTemplate[]}
       */
      let localTemplates = [];
      try {
        localTemplates = await loadTemplates(outputConfig, scafflater);
      } catch (error) {
        logger.error(error.message);
      }

      // Create a list of all available template, related with theirs templates
      let availablePartials = localTemplates.flatMap((lt) =>
        lt.partials.map((lp) => new LocalPartialTemplate(lt.name, lp)),
      );

      // Filtering by partial name, if is an argument
      if (runArgs.PARTIAL_NAME) {
        availablePartials = availablePartials.filter(
          (ap) => ap.name === runArgs.PARTIAL_NAME,
        );
      }

      if (runFlags.template) {
        availablePartials = availablePartials.filter(
          (ap) => ap.templateName === runFlags.template,
        );
      }

      if (availablePartials.length > 1) {
        const availableTemplateNames = availablePartials
          .map((ap) => ap.templateName)
          .filter((value, index, self) => self.indexOf(value) === index);
        if (availableTemplateNames.length > 1) {
          // Just print additional message to guide the user
          logger.print(
            `There are many available ${chalk.bold(
              runArgs.PARTIAL_NAME,
            )} on initialized templates`,
          );
        }

        const choices = availableTemplateNames.flatMap((tn) =>
          [new inquirer.Separator(chalk.bold(tn.toUpperCase()))].concat(
            availablePartials
              .filter((ap) => ap.templateName === tn)
              .map((ap) => {
                return {
                  name: ap.name,
                  short: ap.name,
                  value: ap,
                };
              }),
          ),
        );

        const prompt = await inquirer.prompt([
          {
            type: "rawlist",
            name: "availablePartial",
            message: "Which partial do you want to run?",
            choices,
          },
        ]);

        availablePartials = [prompt.availablePartial];
      }

      if (availablePartials.length !== 1) {
        if (runArgs.PARTIAL_NAME && runFlags.template) {
          logger.error(
            `The partial '${chalk.bold(
              runArgs.PARTIAL_NAME,
            )}' is not available on the template '${chalk.bold(
              runFlags.template,
            )}'`,
          );
          return;
        }

        if (runArgs.PARTIAL_NAME) {
          logger.error(
            `The partial '${chalk.bold(
              runArgs.PARTIAL_NAME,
            )}' is not available on any initialized template`,
          );
          return;
        }

        if (runFlags.template) {
          logger.error(
            `The partial is not available on the template '${chalk.bold(
              runFlags.template,
            )}'`,
          );
          return;
        }

        logger.error(
          `Could not execute partial. No partial found on the initialized templates.`,
        );
        return;
      }

      const localPartial = availablePartials[0];

      const parameters = parseParametersNames(
        await promptMissingParameters(
          runFlags.parameters,
          localPartial.parameters,
          outputConfig.globalParameters,
          outputConfig.templates.find(
            (rt) => rt.name === localPartial.templateName,
          ).templateParameters,
        ),
      );

      logger.info("Running partial template");

      await scafflater.runPartial(
        localPartial.templateName,
        localPartial.name,
        parameters,
        runFlags.output,
      );

      logger.log("notice", "Partial results appended to output!");
    } catch (error) {
      logger.error(error);
    }
  }
}
