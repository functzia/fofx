const getNanosQueue = require('./lib/queue');
const { getPluginsByType } = require('./lib/plugins');
const { loadNanos } = require('./lib/nanos');
const Logger = require('./lib/logger');
const logText = require('./lib/logger/text');

async function setupFofx(logLevel, pluginsFile, nanosFile) {
  const log = new Logger(Logger.levels[logLevel.toUpperCase()]);
  logText(log);
  const fofxLog = log.scoped('fofx');
  try {
    const nq = getNanosQueue(log);
    const pluginsByType = await getPluginsByType(pluginsFile, log);
    await loadNanos(nanosFile, pluginsByType, nq);
    fofxLog.info('Ready to go!');
  } catch (error) {
    fofxLog.fatal('Fatal platform error');
    fofxLog.fatal(error);
  }
}

setupFofx(...process.argv.slice(2)).catch(console.error);
