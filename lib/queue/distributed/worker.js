const RSMQWorker = require('rsmq-worker');
const { getRSMQ, send, JOBS, RESULTS } = require('./distributed-utils');
const Logger = require('../../logger');
const logText = require('../../logger/text');
const { getJsonFromFile, fetchNanos } = require('../../nanos');
const stateFactory = require('../../state/distributed');

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
      (map, { nano, app, config }) =>
        Object.assign(map, { [nano]: { app, useState: config.useState } }),
      {}
    );
    const getNanoState = stateFactory(broker);
    const rsmq = getRSMQ(broker);
    const worker = new RSMQWorker(JOBS, { rsmq, autostart: true });
    worker.on('message', async (msg, next, msgId) => {
      const { nano, args } = JSON.parse(msg);
      const { app, useState } = apps[nano];
      try {
        const ctx = { log: log.scoped(nano) };
        if (useState) {
          ctx.state = getNanoState(nano);
        }
        const value = await app.call(ctx, ...args);
        send(rsmq, RESULTS, { msgId, nano, value });
      } catch (error) {
        workerLog.error(error);
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
