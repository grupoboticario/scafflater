module.exports = {
  ...require("./errors"),
  ...require("./scafflater"),
  ...require("./template-manager"),
  ...require("./scafflater-config"),
  ...require("./options"),
  ...require("./template-cache"),
  ...require("./generator/appenders"),
  ...require("./generator/processors"),
};
