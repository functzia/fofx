const cluster = require('cluster');
const fs = require('fs');
const EventEmitter = require('events');

class FileWatcher extends EventEmitter {
  constructor(files) {
    super();
    this._files = files;
    for (const file of files) {
      fs.watchFile(file, () => this.emit('change', file));
    }
  }
}

function handleMessage({ type, payload }) {
  switch (type) {
    case 'START': {
      main(payload).then(() => process.send({ type: 'READY' }));
    }
  }
}

function createWorker(state, payload) {
  const worker = cluster.fork();
  worker.send({ type: 'START', payload });
  worker.on('message', ({ type }) => {
    if (type === 'READY') {
      state.ready = true;
    }
  });
  return worker;
}

module.exports = function start(
  filesToWatch,
  main,
  throttleInterval,
  onChange
) {
  if (cluster.isMaster) {
    const watcher = new FileWatcher(filesToWatch);
    const state = { ready: false, reload: false };

    let green = createWorker(state);
    watcher.on('change', () => {
      state.reload = true;
    });
    setInterval(() => {
      if (state.ready && state.reload) {
        state.ready = state.reload = false;
        green.kill();
        onChange && onChange();
        const blue = createWorker(state);
        green = blue;
      }
    }, throttleInterval);
  } else {
    process.on('message', ({ type, payload }) => {
      switch (type) {
        case 'START': {
          main(payload).then(() => process.send({ type: 'READY' }));
        }
      }
    });
  }
};
