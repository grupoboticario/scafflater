const { execSync } = require("child_process");

module.exports = (packagePath) => {
  execSync("npm install", { cwd: packagePath });
};
