const localQueue = require('./local');
const distributedQueue = require('./distributed/queue');

module.exports = function(log, broker) {
  if (!broker) {
    return localQueue(log);
  }
  return distributedQueue(log, broker);
};
