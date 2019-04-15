const path = require('path');
const install = require('@fofx/install');

async function getPluginsByType(
  modulesDir,
  pluginsSpecs,
  log,
  installModules = true
) {
  const exPluginsSpecs = pluginsSpecs.map(spec =>
    typeof spec === 'string' ? { name: spec } : spec
  );
  const specNames = exPluginsSpecs.map(spec => spec.name);
  if (installModules) {
    log.info('fofx', `Installing ${specNames.length} plugins...`);
  }
  const pluginsModules = path.join(modulesDir, 'plugins');
  const manifests = await install(pluginsModules, specNames, installModules);
  const pluginsByType = manifests.reduce((plg, { name }, idx) => {
    const pluginFactory = require(path.join(
      pluginsModules,
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

module.exports = getPluginsByType;
