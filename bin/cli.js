#! /usr/bin/env node
const { argv } = require('yargs')
  .usage(
    'Usage: $0 --plugins <plugins file> --nanos <nanos file> [--level=INFO]'
  )
  .demandOption(['plugins', 'nanos'])
  .default('level', 'INFO')
  .describe('plugins', 'Path to plugins JSON file')
  .describe('nanos', 'Path to nanos JSON file')
  .describe(
    'level',
    'Minimal log level to print (DOC|DEBUG|INFO|WARN|ERROR|FATAL)'
  );
const setupFofx = require('..');
setupFofx(argv.level, argv.plugins, argv.nanos).catch(console.error);
