#! /usr/bin/env node
const path = require('path');
const { argv } = require('yargs')
  .usage(
    'Usage: fofx-worker [...options] <--broker="redis://:passwd@host:port/db">'
  )
  .required('broker')

  .boolean('dry')

  .default('level', 'INFO')
  .default('nanos', path.join(process.cwd(), 'nanos.json'))
  .default('modules', path.join(process.cwd(), 'modules'))

  .describe('broker', 'Redis broker connections string')
  .describe(
    'level',
    'Minimal log level to print (DOC|DEBUG|INFO|WARN|ERROR|FATAL)'
  )
  .describe('nanos', 'Path to nanos JSON file')
  .describe('dry', "Don't install the nanos")
  .describe('modules', 'Directory in which to save dependencies for runtime');

const startWorker = require('../lib/queue/distributed/worker');
startWorker(argv);
