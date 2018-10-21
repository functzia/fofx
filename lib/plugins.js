const { getJsonFromFile } = require('./utils');
const npm = require('./npm');
const prequire = require('../plugins');

async function getPluginsByType(pluginsFile, install = true) {
  const pluginsSpecs = await getJsonFromFile(pluginsFile);
  const exPluginsSpecs = pluginsSpecs.map(
    spec => (typeof spec === 'string' ? { name: spec } : spec)
  );
  const specNames = exPluginsSpecs.map(spec => spec.name);
  const [manifests] = await Promise.all([
    npm.getManifests(specNames, '../cache'),
    install
      ? await npm.installModulesInto('../plugins', specNames)
      : Promise.resolve(),
  ]);
  const pluginsByType = manifests.reduce((plg, { name }, idx) => {
    const pluginFactory = prequire(name);
    const config = exPluginsSpecs[idx].params || {};
    const plugin = pluginFactory(config);
    plg[plugin.type] = plugin;
    return plg;
  }, {});
  return pluginsByType;
}

module.exports = { getPluginsByType };
