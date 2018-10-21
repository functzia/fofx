const chalk = require('chalk');
const timestamp = require('time-stamp');

const enabled = new WeakSet();

function getColor(level) {
  switch (level) {
    case 'DOC':
      return chalk.green;
    case 'DEBUG':
      return chalk.blue;
    case 'INFO':
      return chalk.cyan;
    case 'WARN':
      return chalk.yellow;
    case 'ERROR':
      return chalk.red;
    case 'FATAL':
      return chalk.yellow.bgRed;
    default:
      return text => text;
  }
}

module.exports = logger => {
  if (!enabled.has(logger)) {
    enabled.add(logger);
    logger.on('message', ({ level, scope, args }) => {
      console.log(
        `[${timestamp('DD-MM-YYYY HH:mm:ss.ms')}] [${getColor(level)(
          level
        )}] (${scope})`,
        ...args
      );
    });
  }
};
