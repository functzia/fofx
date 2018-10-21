const EventEmitter = require('events');
const uuid = require('uuid');

function getNanosQueue() {
  const nanos = {};
  const resolver = new EventEmitter();
  resolver.on('input', async ({ nano, args, tid }) => {
    if (!nanos[nano]) {
      return resolver.emit('error', new Error('Function not found'));
    }
    const app = nanos[nano];
    try {
      const output = await app(...args);
      resolver.emit(`${tid}/output`, output);
      resolver.emit(`${nano}/output`, output);
    } catch (err) {
      return resolver.emit('error', err);
    }
  });
  resolver.on('error', console.error);
  return {
    recordNano(nano, app) {
      nanos[nano] = app;
    },
    getTrigger(nano) {
      return (...args) =>
        new Promise(resolve => {
          const tid = uuid();
          resolver.emit('input', { nano, args, tid });
          resolver.once(`${tid}/output`, resolve);
        });
    },
    registerOutput(nano, handler) {
      resolver.on(`${nano}/output`, handler);
    },
  };
}

module.exports = getNanosQueue;
