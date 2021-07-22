const { spawn } = require("child_process");

/**
 *
 * @param {string} command the command to run
 * @param {string[]} args the arguments to pass the command
 * @returns {Promise<string>} Promise of output message
 */
const runCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    let scriptOutput = "";
    const process = spawn(command, args);

    process.stdout.setEncoding("utf8");
    process.stdout.on("data", (data) => {
      data = data.toString();
      scriptOutput += data;
    });

    process.stderr.on("data", (data) => {
      data = data.toString();
      scriptOutput += data;
    });

    process.on("error", (error) => {
      return reject(error);
    });

    process.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(
            `Error: Command ${command} failed, exit code ${code}: ${scriptOutput}`
          )
        );
      }
      return resolve(scriptOutput);
    });
  });
};

module.exports = {
  runCommand,
};
