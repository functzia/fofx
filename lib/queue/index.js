const localQueue = require('./local');
const distributedQueue = require('./distributed');

module.exports = function(log, port) {
  if (!port) {
    return localQueue(log);
  }
  return distributedQueue(log, port);
};
