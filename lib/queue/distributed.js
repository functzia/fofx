const { startQueueBroker } = require('@fofx/queue');

module.exports = async function getDistributedNanosQueue(log, port) {
  const enqueue = startQueueBroker(port);
  log.info(`Broker listening on "ws://localhost:${port}"`);
  const outputs = {};
  return {
    recordNano() {},
    getTrigger(nano) {
      return (...args) =>
        enqueue('invokeNano', { nano, args })
          .then(value => {
            if (outputs[nano]) {
              outputs[nano](value);
            }
            return { ok: true, value };
          })
          .catch(error => ({ ok: false, error }));
    },
    registerOutput(nano, handler) {
      outputs[nano] = handler;
    },
  };
};
