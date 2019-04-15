#! /usr/bin/env node
const path = require('path');
const { argv } = require('yargs')
  .usage(
    'Usage: fofx-worker [...options] <--broker="wss?://host:port">'
  )
  .required('broker')

  .boolean('dry')

  .default('level', 'INFO')
  .default('manifest', path.join(process.cwd(), 'package.json'))
  .default('modules', path.join(process.cwd(), 'modules'))

  .describe('broker', 'Broker connections string (e.g. ws://localhost:9999)')
  .describe(
    'level',
    'Minimal log level to print (DOC|DEBUG|INFO|WARN|ERROR|FATAL)'
  )
  .describe('manifest', 'Path to package.json file')
  .describe('dry', "Don't install the nanos")
  .describe('modules', 'Directory in which to save dependencies for runtime');

const startWorker = require('../worker');
startWorker(argv);
