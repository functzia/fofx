#! /usr/bin/env node
const path = require('path');
const { argv } = require('yargs')
  .usage(
    'Usage: $0 --plugins <plugins file> --nanos <nanos file> [--level=INFO]'
  )
  .demandOption(['plugins', 'nanos'])
  .default('level', 'INFO')
  .default('modules', path.join(process.cwd(), 'modules'))
  .describe('plugins', 'Path to plugins JSON file')
  .describe('nanos', 'Path to nanos JSON file')
  .describe('modules', 'Directory in which to save dependencies for runtime')
  .describe(
    'level',
    'Minimal log level to print (DOC|DEBUG|INFO|WARN|ERROR|FATAL)'
  );
const setupFofx = require('..');
setupFofx(argv).catch(console.error);
