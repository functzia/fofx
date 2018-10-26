const EventEmitter = require('events');
const uuid = require('uuid');

function getNanosQueue(log) {
  const nanos = {};
  const resolver = new EventEmitter();
  resolver.on('input', async ({ nano, args, tid }) => {
    if (!nanos[nano]) {
      return log.error('Queue', new Error('Nano not found'));
    }
    const app = nanos[nano];
    try {
      const output = await app.call({ log: log.scoped(nano) }, ...args);
      resolver.emit(`${tid}`, { ok: true, value: output });
      resolver.emit(`${nano}/output`, output);
    } catch (err) {
      resolver.emit(`${tid}`, { ok: false, error: err });
      return log.error('Queue', err);
    }
  });
  return {
    recordNano(nano, app) {
      nanos[nano] = app;
    },
    getTrigger(nano) {
      return (...args) =>
        new Promise(resolve => {
          const tid = uuid();
          resolver.emit('input', { nano, args, tid });
          resolver.once(`${tid}`, resolve);
        });
    },
    registerOutput(nano, handler) {
      resolver.on(`${nano}/output`, handler);
    },
  };
}

module.exports = getNanosQueue;
