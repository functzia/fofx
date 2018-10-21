const path = require('path');
const { getJsonFromFile, wrapByDevNull } = require('./utils');
const npm = require('./npm');

const getManifests = wrapByDevNull(async (modulesDir, specNames, install) => {
  const [manifests] = await Promise.all([
    npm.getManifests(specNames, path.join(modulesDir, 'cache')),
    install
      ? await npm.installModulesInto(
          path.join(modulesDir, 'plugins'),
          specNames
        )
      : Promise.resolve(),
  ]);
  return manifests;
});

async function getPluginsByType(modulesDir, pluginsFile, log, install = true) {
  const pluginsSpecs = await getJsonFromFile(pluginsFile);
  const exPluginsSpecs = pluginsSpecs.map(
    spec => (typeof spec === 'string' ? { name: spec } : spec)
  );
  const specNames = exPluginsSpecs.map(spec => spec.name);
  log.info('fofx', `Installing ${specNames.length} plugins...`);
  const manifests = await getManifests(modulesDir, specNames, install);
  const pluginsByType = manifests.reduce((plg, { name }, idx) => {
    const pluginFactory = require(path.join(
      modulesDir,
      'plugins',
      'node_modules',
      name
    ));
    const config = exPluginsSpecs[idx].params || {};
    const plugin = pluginFactory(config, log.scoped(name));
    plg[plugin.type] = plugin;
    return plg;
  }, {});
  return pluginsByType;
}

module.exports = { getPluginsByType };
