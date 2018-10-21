const path = require('path');
const { getJsonFromFile } = require('./utils');
const npm = require('./npm');
const nrequire = require('../nanos');

async function fetchNanos(nanos, install = true) {
  const [manifests] = await Promise.all([
    npm.getManifests(nanos, '../cache'),
    install
      ? await npm.installModulesInto(path.resolve(__dirname, '../nanos'), nanos)
      : Promise.resolve(),
  ]);
  return manifests.map(({ name: nano }) => {
    const config = nrequire(nano + '/nano.json');
    const app = nrequire(nano);
    return { nano, config, app };
  });
}

async function loadNanos(nanosFile, pluginsByType, nanosQueue, install = true) {
  const nanosPaths = await getJsonFromFile(nanosFile);
  const nanos = await fetchNanos(nanosPaths, install);
  for (const { nano, config, app } of nanos) {
    const inputPlugin = pluginsByType[config.input.type];
    if (!inputPlugin || !inputPlugin.input) {
      throw new Error(`Input type "${config.input.type}" not found.`);
    }
    inputPlugin.input(config.input, nanosQueue.getTrigger(nano));
    if (config.output) {
      const outputPlugin = pluginsByType[config.output.type];
      if (!outputPlugin || !outputPlugin.input) {
        throw new Error(`Output type "${config.output.type}" not found.`);
      }
      const outputHandler = outputPlugin.output(config.output);
      nanosQueue.registerOutput(nano, outputHandler);
    }
    nanosQueue.recordNano(nano, app);
    console.log(`Nano ${nano} loaded`);
  }
}

module.exports = { loadNanos };
