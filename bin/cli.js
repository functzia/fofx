#! /usr/bin/env node
const path = require('path');
const { argv } = require('yargs')
  .usage(
    'Usage: $0 --plugins [plugins file] --nanos [nanos file] [--level=INFO]'
  )
  .default('level', 'INFO')
  .default('modules', path.join(process.cwd(), 'modules'))
  .default('plugins', path.join(process.cwd(), 'plugins.json'))
  .default('nanos', path.join(process.cwd(), 'nanos.json'))
  .describe('plugins', 'Path to plugins JSON file')
  .describe('nanos', 'Path to nanos JSON file')
  .describe('modules', 'Directory in which to save dependencies for runtime')
  .describe(
    'level',
    'Minimal log level to print (DOC|DEBUG|INFO|WARN|ERROR|FATAL)'
  );
const startGB = require('./green-blue');
const setupFofx = require('..');

const main = () => setupFofx(argv).catch(console.error);
startGB([argv.plugins, argv.nanos], main, 10000, () =>
  console.log('fofx detected changes in your configuration files, reloading...')
);
