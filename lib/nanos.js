const { getJsonFromFile } = require('./utils');

async function loadNanos(nanosFile, pluginsByType, nanosQueue) {
  const nanosPaths = await getJsonFromFile(nanosFile);
  for (const nano of nanosPaths) {
    const config = require(nano + '/nano.json');
    const app = require(nano);
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
