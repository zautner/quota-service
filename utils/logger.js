const winston = require('winston');
require ('./global');
// winston.handleExceptions(new winston.transports.Console(
//   {
//     colorize: 'message', json: true, prettyPrint: true, showLevel: true, label: 'analytic-service', depth: 1000
//   }));
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new (winston.transports.Console)({
      timestamp: true,
      showLevel: true,
      json: false,
      eol: '',
      handleExceptions: true,
      humanReadableUnhandledException: true,
      // eslint-disable-next-line no-undef
      label: 'quota-service',
      depth: '6',
      prettyPrint: true,
      align: true
    })
  ],
  exitOnError: false,
});

logger.critical = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      showLevel: true,
      timestamp: true,
      json: false,
      eol: ' !!!',
      prettyPrint: true,
      handleExceptions: true,
      humanReadableUnhandledException: true,
      // eslint-disable-next-line no-undef
      label: 'quota-service',
      colorize: false,
      depth: '10',
      align: true
    })
  ],
  exitOnError: false
});

module.exports = logger;
