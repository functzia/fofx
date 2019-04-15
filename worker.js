const { startQueueWorker} = require('@fofx/queue');
const Logger = require('./lib/logger');
const logText = require('./lib/logger/text');
const { fetchNanos } = require('./lib/nanos');
const stateFactory = require('./lib/state/distributed');

module.exports = async function createWorker({
  level,
  broker,
  manifest,
  modules,
  dry,
}) {
  const log = new Logger(Logger.levels[level.toUpperCase()]);
  logText(log);
  const workerLog = log.scoped('worker');
  try {
    const { fofx } = require(manifest);
    const client = startQueueWorker(broker);
    const { nanos: nanosPaths } = fofx;
    const nanosList = await fetchNanos(modules, nanosPaths, workerLog, !dry);
    const apps = nanosList.reduce(
      (map, { nano, app, config }) =>
        Object.assign(map, { [nano]: { app, useState: config.useState } }),
      {}
    );
    const getNanoState = stateFactory(client);
    client.register(async function invokeNano({ nano, args}) {
      const { app, useState } = apps[nano];
      try {
        const ctx = { log: log.scoped(nano) };
        if (useState) {
          ctx.state = getNanoState(nano);
        }
        const value = await app.call(ctx, ...args);
        return value;
      } catch (error) {
        workerLog.error(error);
        throw error;
      }
    });
  } catch (error) {
    workerLog.fatal('Fatal worker error');
    workerLog.fatal(error);
    process.exit(1);
  }
};
