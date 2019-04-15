#! /usr/bin/env node
const path = require('path');
const { argv } = require('yargs')
  .usage('Usage: fofx [...options] [--watch]')
  .boolean('watch')
  .boolean('dry')
  .conflicts('watch', 'port')

  .default('level', 'INFO')
  .default('modules', path.join(process.cwd(), 'modules'))
  .default('manifest', path.join(process.cwd(), 'package.json'))

  .describe('watch', 'Watch plugins and nanos files for changes, and reload')
  .describe('port', 'Run fofx as a master, using a local websocket server')
  .describe(
    'level',
    'Minimal log level to print (DOC|DEBUG|INFO|WARN|ERROR|FATAL)'
  )
  .describe('manifest', 'Path to package.json file')
  .describe('modules', 'Directory in which to save dependencies for runtime')
  .describe('dry', "Don't actually install anything");

const startGB = require('./green-blue');
const setupFofx = require('..');

const main = () => setupFofx(argv).catch(console.error);
if (!argv.watch) {
  main();
} else {
  startGB([argv.manifest], main, 10000, () =>
    console.log(
      'fofx detected changes in your configuration files, reloading...'
    )
  );
}
