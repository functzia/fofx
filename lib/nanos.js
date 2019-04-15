const path = require('path');
const install = require('@fofx/install');

async function fetchNanos(modulesDir, nanos, log, installModules = true) {
  if (installModules) {
    log.info(`Installing ${nanos.length} nanos...`);
  }
  const nanosModules = path.join(modulesDir, 'nanos');
  const manifests = await install(nanosModules, nanos, installModules);
  return manifests.map(({ name: nano }) => {
    const modulePath = path.join(nanosModules, 'node_modules', nano);
    const { fofx: config } = require(modulePath + '/package.json');
    const app = require(modulePath);
    return { nano, config, app };
  });
}

async function loadNanos(
  modulesDir,
  nanosPaths,
  pluginsByType,
  nanosQueue,
  log,
  install = true
) {
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
    nanosQueue.recordNano(nano, app, config);
    log.debug(`Nano ${nano} loaded`);
  }
}

module.exports = { loadNanos, fetchNanos };
