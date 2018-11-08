const path = require('path');
const mkdirp = require('mkdirp');
const { promisify } = require('./lib/utils');
const getNanosQueue = require('./lib/queue');
const { getPluginsByType } = require('./lib/plugins');
const { loadNanos } = require('./lib/nanos');
const Logger = require('./lib/logger');
const logText = require('./lib/logger/text');

async function setupFofx({
  level,
  plugins,
  nanos,
  modules,
  broker,
  dry = false,
}) {
  const log = new Logger(Logger.levels[level.toUpperCase()]);
  logText(log);
  const fofxLog = log.scoped('fofx');
  try {
    await promisify(mkdirp)(path.join(modules, 'plugins'));
    await promisify(mkdirp)(path.join(modules, 'nanos'));
    await promisify(mkdirp)(path.join(modules, 'cache'));
    const nq = await getNanosQueue(log, broker);
    const pluginsByType = await getPluginsByType(modules, plugins, log, !dry);
    await loadNanos(modules, nanos, pluginsByType, nq, fofxLog, !dry);
    fofxLog.info('Ready to go!');
  } catch (error) {
    fofxLog.fatal('Fatal platform error');
    fofxLog.fatal(error);
    process.exit(1);
  }
}

module.exports = setupFofx;
