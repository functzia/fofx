#! /usr/bin/env node
const path = require('path');
const yargs = require('yargs');
const startMaster = require('@fofx/core');
const { createLogger, textMode } = require('@fofx/logger');
const startGB = require('./green-blue');

function parseArguments() {
  const {
    argv: { watch, dry, port, level, modules, manifest },
  } = yargs
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
  return { watch, dry, port, level, modules, manifest };
}

const { watch, dry, port, level, modules, manifest } = parseArguments();

async function main() {
  try {
    const { fofx: fofxConfig } = require(manifest);
    const install = !dry;
    const log = createLogger();
    log.setMode(textMode, createLogger.logLevels[level]);
    await startMaster({ log, fofxConfig, modulesDir: modules, port, install });
  } catch (err) {
    console.error(err);
  }
}

if (!watch) {
  main();
} else {
  startGB([manifest], main, 10000, () =>
    console.log(
      'fofx detected changes in your configuration files, reloading...'
    )
  );
}
