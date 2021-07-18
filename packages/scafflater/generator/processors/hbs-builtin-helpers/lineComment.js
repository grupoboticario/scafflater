const util = require("../../../util");

module.exports = (context, options) => {
  return util.buildLineComment(options.data.root.options, options.fn(context));
};
