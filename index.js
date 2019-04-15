const getNanosQueue = require('./lib/queue');
const getPluginsByType = require('./lib/plugins');
const { loadNanos } = require('./lib/nanos');
const Logger = require('./lib/logger');
const logText = require('./lib/logger/text');

async function setupFofx({ level, manifest, modules, port, dry = false }) {
  const log = new Logger(Logger.levels[level.toUpperCase()]);
  logText(log);
  const fofxLog = log.scoped('fofx');
  try {
    const { fofx } = require(manifest);
    const { plugins, nanos } = fofx;
    const nq = await getNanosQueue(log, port);
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
