const {createLogger, format, transports, config} = require('winston')
const chalk = require('chalk')
const {combine, timestamp, label, printf, simple, splat} = format
const consoleFormat = printf(({level, message, label, timestamp}) => {
  var levelUpper = level.toUpperCase()
  switch (levelUpper) {
  case 'DEBUG':
    message = chalk.gray(message)
    level = chalk.black.bgGreenBright.bold('D')
    break

  case 'INFO':
    level = chalk.bgBlue.white('ℹ')
    break

  case 'WARN':
    message = chalk.yellow(message)
    level = chalk.bgYellow.black('⚠')
    break

  case 'ERROR':
    message = chalk.red(message)
    level = chalk.red('✖')
    break

  case 'NOTICE':
    level = chalk.green('✔')
    break

  default:
    break
  }
  return `${level} ${message}`
})
// const fileFormat = printf(({level, message, label, timestamp}) => {
//   return `[${label}] [${timestamp}] [${level}]: ${message}`
// })
const logger = createLogger({
  levels: config.syslog.levels,
  level: 'info',
  format: combine(
    label({label: 'YOUR_LABEL'}),
    timestamp(),
    format.splat(),
    consoleFormat

  ),
  transports: [
    new transports.Console(),
    // new transports.File({
    //   filename: 'logs/YOUR_LOG_FILE_NAME.log',
    //   format: combine(
    //     label({label: 'YOUR_LOG_FILE_NAME'}),
    //     timestamp(),
    //     format.splat(),
    //     fileFormat
    //   ),
    // }),
  ],
})

module.exports = logger
