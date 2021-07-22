const Processor = require("./processor");
const Handlebars = require("handlebars");
const fsUtil = require("../../fs-util");
const path = require("path");

/**
 * Compile and apply the handlebar js on input
 *
 * @augments Processor
 */
class HandlebarsProcessor extends Processor {
  constructor() {
    super();
    HandlebarsProcessor.loadHelpersFolder("./hbs-builtin-helpers");
  }

  process(context, input) {
    const parentResult = super.process(context, input);
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
      const helperFunction = fsUtil.require(js);
      const helperName = path.basename(js, ".js");
      Handlebars.registerHelper(helperName, helperFunction);
    }
  }
}

module.exports = HandlebarsProcessor;
