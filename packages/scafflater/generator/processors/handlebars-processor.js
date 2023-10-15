import Processor from "./processor.js";
import Handlebars from "handlebars";
import fsUtil from "../../fs-util/index.js";
import path from "path";
import Case from "./hbs-builtin-helpers/case.js";
import lineComment from "./hbs-builtin-helpers/lineComment.js";
import echo from "./hbs-builtin-helpers/echo.js";

/**
 * Compile and apply the handlebar js on input
 * @augments Processor
 */
export default class HandlebarsProcessor extends Processor {
  constructor() {
    super();
    Handlebars.registerHelper("case", Case);
    Handlebars.registerHelper("lineComment", lineComment);
    Handlebars.registerHelper("echo", echo);
  }

  async process(context, input) {
    const parentResult = await super.process(context, input);
    return {
      context,
      result: Handlebars.compile(parentResult.result, { noEscape: true })(
        parentResult.context,
      ),
    };
  }

  static async loadHelpersFolder(folderPath) {
    if (!folderPath || !(await fsUtil.pathExists(folderPath))) {
      return;
    }

    for (const js of await fsUtil.listFilesByExtensionDeeply(
      folderPath,
      "js",
    )) {
      if (js.endsWith(".test.js")) continue;
      const helperFunction = fsUtil.require(js);
      const helperName = path.basename(js, ".js");
      Handlebars.registerHelper(helperName, helperFunction);
    }
  }
}
