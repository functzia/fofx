const RSMQWorker = require('rsmq-worker');
const { getRSMQ, send, JOBS, RESULTS } = require('./distributed-utils');
const Logger = require('../../logger');
const logText = require('../../logger/text');
const { getJsonFromFile, fetchNanos } = require('../../nanos');

module.exports = async function createWorker({
  level,
  broker,
  nanos,
  modules,
  dry,
}) {
  const log = new Logger(Logger.levels[level.toUpperCase()]);
  logText(log);
  const workerLog = log.scoped('worker');
  try {
    const nanosPaths = await getJsonFromFile(nanos);
    const nanosList = await fetchNanos(modules, nanosPaths, workerLog, !dry);
    const apps = nanosList.reduce(
      (map, { nano, app }) => Object.assign(map, { [nano]: app }),
      {}
    );
    const rsmq = getRSMQ(broker);
    const worker = new RSMQWorker(JOBS, { rsmq, autostart: true });
    worker.on('message', async (msg, next, msgId) => {
      const { nano, args } = JSON.parse(msg);
      const app = apps[nano];
      try {
        const value = await app.call({ log: log.scoped(nano) }, ...args);
        send(rsmq, RESULTS, { msgId, nano, value });
      } catch (error) {
        const { message, stack } = error;
        send(rsmq, RESULTS, { msgId, nano, error: { message, stack } });
      }
      next();
    });
  } catch (error) {
    workerLog.fatal('Fatal worker error');
    workerLog.fatal(error);
    process.exit(1);
  }
};
