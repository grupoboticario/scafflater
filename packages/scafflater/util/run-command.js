const { exec } = require("child_process");

/**
 * @class runCommandOptions
 * @description Run command options
 */
class runCommandOptions {
  /**
   * Current working directory of the child process.
   */
  cwd;

  /**
   * Logger
   */
  logger;
}

const getDefaultLogger = () => {
  return {
    info: (message) => {
      console.log(message);
    },
    error: (message) => {
      console.error(message);
    },
  };
};

/**
 *
 * @param {string} command the command to run
 * @param {runCommandOptions} options Run command options
 * @returns {Promise<string>} Promise of output message
 */
const runCommand = (command, options = {}) => {
  options.logger = options?.logger ?? getDefaultLogger();
  return new Promise((resolve, reject) => {
    try {
      let scriptOutput = "";
      const process = exec(command, { cwd: options.path });

      process.stdout.setEncoding("utf8");
      process.stdout.on("data", (data) => {
        data = data.toString();
        options.logger.info(data);
        scriptOutput += data;
      });

      process.stderr.on("data", (data) => {
        data = data.toString();
        options.logger.error(data);
        scriptOutput += data;
      });

      process.on("error", (error) => {
        options.logger.error(error);
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
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  runCommand,
};
