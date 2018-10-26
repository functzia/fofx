const path = require('path');
const { getJsonFromFile, wrapByDevNull } = require('./utils');
const npm = require('./npm');

const getManifests = wrapByDevNull(async (modulesDir, nanos, install) => {
  const [manifests] = await Promise.all([
    npm.getManifests(nanos, path.join(modulesDir, 'cache')),
    install
      ? await npm.installModulesInto(path.join(modulesDir, 'nanos'), nanos)
      : Promise.resolve(),
  ]);
  return manifests;
});

async function fetchNanos(modulesDir, nanos, log, install = true) {
  log.info(`Installing ${nanos.length} nanos...`);
  const manifests = await getManifests(modulesDir, nanos, install);
  return manifests.map(({ name: nano }) => {
    const modulePath = path.join(modulesDir, 'nanos', 'node_modules', nano);
    const config = require(modulePath + '/nano.json');
    const app = require(modulePath);
    return { nano, config, app };
  });
}

async function loadNanos(
  modulesDir,
  nanosFile,
  pluginsByType,
  nanosQueue,
  log,
  install = true
) {
  const nanosPaths = await getJsonFromFile(nanosFile);
  const nanos = await fetchNanos(modulesDir, nanosPaths, log, install);
  for (const { nano, config, app } of nanos) {
    const inputPlugin = pluginsByType[config.input.type];
    if (!inputPlugin || !inputPlugin.input) {
      throw new Error(`Input type "${config.input.type}" not found.`);
    }
    inputPlugin.input(config.input, nanosQueue.getTrigger(nano));
    if (config.output) {
      const outputPlugin = pluginsByType[config.output.type];
      if (!outputPlugin || !outputPlugin.output) {
        throw new Error(`Output type "${config.output.type}" not found.`);
      }
      const outputHandler = outputPlugin.output(config.output);
      nanosQueue.registerOutput(nano, outputHandler);
    }
    nanosQueue.recordNano(nano, app);
    log.debug(`Nano ${nano} loaded`);
  }
}

module.exports = { loadNanos, getJsonFromFile, fetchNanos };
