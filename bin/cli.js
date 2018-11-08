#! /usr/bin/env node
const path = require('path');
const { argv } = require('yargs')
  .usage('Usage: fofx [...options] [--watch]')
  .boolean('watch')
  .boolean('dry')
  .conflicts('watch', 'broker')

  .default('level', 'INFO')
  .default('modules', path.join(process.cwd(), 'modules'))
  .default('plugins', path.join(process.cwd(), 'plugins.json'))
  .default('nanos', path.join(process.cwd(), 'nanos.json'))

  .describe('watch', 'Watch plugins and nanos files for changes, and reload')
  .describe(
    'broker',
    'Run fofx as a master, using a redis broker connections string'
  )
  .describe(
    'level',
    'Minimal log level to print (DOC|DEBUG|INFO|WARN|ERROR|FATAL)'
  )
  .describe('plugins', 'Path to plugins JSON file')
  .describe('nanos', 'Path to nanos JSON file')
  .describe('modules', 'Directory in which to save dependencies for runtime')
  .describe('dry', "Don't actually install anything");

const startGB = require('./green-blue');
const setupFofx = require('..');

const main = () => setupFofx(argv).catch(console.error);
if (!argv.watch) {
  main();
} else {
  startGB([argv.plugins, argv.nanos], main, 10000, () =>
    console.log(
      'fofx detected changes in your configuration files, reloading...'
    )
  );
}
