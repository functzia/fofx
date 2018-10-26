const RSMQWorker = require('rsmq-worker');
const {
  getRSMQ,
  getQueue,
  send,
  constructError,
  JOBS,
  RESULTS,
} = require('./distributed-utils');

module.exports = async function getDistributedNanosQueue(_log, broker) {
  const rsmq = getRSMQ(broker);
  try {
    await Promise.all([getQueue(rsmq, JOBS), getQueue(rsmq, RESULTS)]);
  } catch (e) {
    // do nothing
  }
  const pending = {};
  const outputs = {};
  const worker = new RSMQWorker(RESULTS, { rsmq, autostart: true });
  worker.on('message', (msg, next) => {
    const { msgId, nano, value, error } = JSON.parse(msg);
    const resolver = pending[msgId];
    delete pending[msgId];
    next();
    if (resolver) {
      if (error) {
        return resolver({ ok: false, error: constructError(error) });
      }
      resolver({ ok: true, value });
    }
    outputs[nano] && outputs[nano](value);
  });
  return {
    recordNano() {},
    getTrigger(nano) {
      return (...args) =>
        new Promise(async resolve => {
          const msgId = await send(rsmq, JOBS, { nano, args });
          pending[msgId] = resolve;
        });
    },
    registerOutput(nano, handler) {
      outputs[nano] = handler;
    },
  };
};
