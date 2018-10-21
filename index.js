const getNanosQueue = require('./lib/queue');
const { getPluginsByType } = require('./lib/plugins');
const { loadNanos } = require('./lib/nanos');

async function main() {
  const nq = getNanosQueue();
  const pluginsByType = await getPluginsByType('./demo/plugins.json');
  await loadNanos('./demo/nanos.json', pluginsByType, nq);
  console.log('Ready To go');
}

main().catch(console.error);
