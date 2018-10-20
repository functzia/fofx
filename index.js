const fs = require('fs');
const EventEmitter = require('events');
const _ = require('lodash');

const promisify = fn => (...args) =>
  new Promise((resolve, reject) =>
    fn(
      ...args,
      (err, ...values) =>
        err ? reject(err) : resolve(values.length > 1 ? values : values[0])
    )
  );

async function getJsonFromFile(filePath) {
  const content = await promisify(fs.readFile)(filePath, { encoding: 'utf8' });
  return JSON.parse(content);
}

function getFunctionsQueue() {
  const fns = {};
  const resolver = new EventEmitter();
  resolver.on('input', async ({ fn, args }) => {
    if (!fns[fn]) {
      return resolver.emit('error', new Error('Function not found'));
    }
    const app = fns[fn];
    try {
      const output = await app(...args);
      resolver.emit(`${fn}/ouput`, output);
    } catch (err) {
      return resolver.emit('error', err);
    }
  });
  return {
    recordFunction(fn, app) {
      fns[fn] = app;
    },
    getTrigger(fn) {
      return (...args) =>
        new Promise(resolve => {
          resolver.emit('input', { fn, args });
          resolver.once(`${fn}/ouput`, resolve);
        });
    }
  };
}

async function main() {
  const fq = getFunctionsQueue();
  const pluginsByType = _.keyBy(
    (await getJsonFromFile('./demo/plugins.json')).map(require),
    'type'
  );
  const fnsPaths = await getJsonFromFile('./demo/fns.json');
  const fns = fnsPaths.reduce(
    (map, path) =>
      Object.assign(map, {
        [path]: { config: require(path + '/fn.json'), app: require(path) }
      }),
    {}
  );
  Object.entries(fns).forEach(([fn, { config, app }]) => {
    const inputPlugin = pluginsByType[config.input.type];
    if (!inputPlugin || !inputPlugin.input) {
      throw new Error(`Input type "${config.input.type}" not found.`);
    }
    inputPlugin.input(config.input, fq.getTrigger(fn));
    // const alertOutput = (...args) => resolver.emit(fn + '/output', ...args);
    fq.recordFunction(fn, app);
  });
}

main().catch(console.error);
