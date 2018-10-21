const EventEmitter = require('events');

const DOC = 0;
const DEBUG = 1;
const INFO = 2;
const WARN = 3;
const ERROR = 4;
const FATAL = 5;

const logLevels = { DOC, DEBUG, INFO, WARN, ERROR, FATAL };

class LogicLogger extends EventEmitter {
  constructor(level = logLevels.INFO) {
    super();
    this.level = level;
    Object.entries(logLevels).forEach(([levelName, levelNum]) => {
      this[levelName.toLowerCase()] = (scope, ...args) =>
        this.level <= levelNum
          ? this.emit('message', { level: levelName, args, scope })
          : this;
    });
  }

  scoped(scope) {
    return Object.keys(logLevels).reduce(
      (methods, method) =>
        Object.assign(methods, {
          [method.toLowerCase()]: this[method.toLowerCase()].bind(this, scope),
        }),
      {}
    );
  }

  get level() {
    return this._level;
  }

  set level(lvl) {
    if (!Object.values(logLevels).includes(lvl)) {
      throw new Error('Bad log level ' + lvl);
    }
    this._level = lvl;
  }
}

Object.assign(LogicLogger, { levels: logLevels });

module.exports = LogicLogger;
