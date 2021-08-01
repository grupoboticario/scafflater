const Processor = require("./processor");
const Handlebars = require("handlebars");
const fsUtil = require("../../fs-util");
const path = require("path");
const Case = require("./hbs-builtin-helpers/case");
const lineComment = require("./hbs-builtin-helpers/lineComment");
const echo = require("./hbs-builtin-helpers/echo");

/**
 * Compile and apply the handlebar js on input
 *
 * @augments Processor
 */
class HandlebarsProcessor extends Processor {
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
        parentResult.context
      ),
    };
  }

  static async loadHelpersFolder(folderPath) {
    if (!folderPath || !(await fsUtil.pathExists(folderPath))) {
      return;
    }

    for (const js of await fsUtil.listFilesByExtensionDeeply(
      folderPath,
      "js"
    )) {
      if (js.endsWith(".test.js")) continue;
      const helperFunction = fsUtil.require(js);
      const helperName = path.basename(js, ".js");
      Handlebars.registerHelper(helperName, helperFunction);
    }
  }
}

module.exports = HandlebarsProcessor;
