const fs = require('fs');
const EventEmitter = require('events');
const rimraf = require('rimraf');
const pacote = require('pacote');
const npm = require('npm/lib/npm.js');
const npmInstall = require('npm/lib/install.js');
const prequire = require('./plugins');

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

const rimrafAP = promisify(rimraf);

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

async function installPlugins(pluginList) {
  await promisify(npm.load)({
    loglevel: 'silent',
    progress: false,
    silent: true
  });
  return new Promise((resolve, reject) => {
    npmInstall(
      './plugins',
      pluginList,
      (err, result) => (err ? reject(err) : resolve(result))
    );
  });
}

async function main() {
  const fq = getFunctionsQueue();
  await rimrafAP('./cache');
  await rimrafAP('./plugins/node_modules');
  await rimrafAP('./plugins/package-lock.json');
  const pluginsSpecs = await getJsonFromFile('./demo/plugins.json');
  const exPluginsSpecs = pluginsSpecs.map(
    spec => (typeof spec === 'string' ? { name: spec } : spec)
  );
  const specNames = exPluginsSpecs.map(spec => spec.name);
  const [manifests] = await Promise.all([
    await Promise.all(
      specNames.map(spec => pacote.manifest(spec, { cache: './cache' }))
    ),
    await installPlugins(specNames)
  ]);
  const pluginsByType = manifests.reduce((plg, { name }, idx) => {
    const pluginFactory = prequire(name);
    const config = exPluginsSpecs[idx].params || {};
    const plugin = pluginFactory(config);
    plg[plugin.type] = plugin;
    return plg;
  }, {});
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
  console.log('Ready To go');
}

main().catch(console.error);
