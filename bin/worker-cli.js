#! /usr/bin/env node
const path = require('path');
const yargs = require('yargs');
const startWorker = require('@fofx/core/worker');
const { createLogger, textMode } = require('@fofx/logger');

function parseArguments() {
  const {
    argv: { broker, dry, level, manifest, modules },
  } = yargs
    .usage('Usage: fofx-worker [...options] <--broker="wss?://host:port">')
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
  return { broker, dry, level, manifest, modules };
}

const { broker, dry, level, manifest, modules } = parseArguments();
const { fofx: fofxConfig } = require(manifest);
const install = !dry;
const log = createLogger();
log.setMode(textMode, createLogger.logLevels[level]);
startWorker({ log, fofxConfig, modulesDir: modules, broker, install });
