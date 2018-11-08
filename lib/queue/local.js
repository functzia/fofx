const EventEmitter = require('events');
const uuid = require('uuid');
const getNanoState = require('../state/local');

function getNanosQueue(log) {
  const nanos = {};
  const resolver = new EventEmitter();
  resolver.on('input', async ({ nano, args, tid }) => {
    if (!nanos[nano]) {
      return log.error('Queue', new Error('Nano not found'));
    }
    const { app, useState } = nanos[nano];
    try {
      const ctx = { log: log.scoped(nano) };
      if (useState) {
        ctx.state = getNanoState(nano);
      }
      const output = await app.call(ctx, ...args);
      resolver.emit(`${tid}`, { ok: true, value: output });
      resolver.emit(`${nano}/output`, output);
    } catch (err) {
      resolver.emit(`${tid}`, { ok: false, error: err });
      return log.error('Queue', err);
    }
  });
  return {
    recordNano(nano, app, { useState }) {
      nanos[nano] = { app, useState };
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
