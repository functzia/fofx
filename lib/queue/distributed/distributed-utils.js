const RedisSMQ = require('rsmq');
const { parseConfig } = require('redis-connection-string');

const JOBS = 'jobs';
const RESULTS = 'results';

function getRSMQOptions(redisConnectionString) {
  const { host, port, ...options } = parseConfig(redisConnectionString);
  return { host, port, options };
}

const getRSMQ = broker => new RedisSMQ(getRSMQOptions(broker));

const getQueue = (rsmq, qname) =>
  new Promise((resolve, reject) =>
    rsmq.createQueue(
      { qname },
      (err, resp) =>
        err
          ? reject(err)
          : resp === 1
            ? resolve(qname)
            : reject(new Error('Could not create queue'))
    )
  );

const send = (rsmq, qname, message) =>
  new Promise((resolve, reject) =>
    rsmq.sendMessage(
      { qname, message: JSON.stringify(message) },
      (err, resp) => (err ? reject(err) : resolve(resp))
    )
  );

const constructError = error => {
  if (typeof error === 'string') {
    return new Error(error);
  }
  const { message, stack } = error;
  const err = new Error(message);
  err.stack = stack;
  return err;
};

module.exports = { getRSMQ, send, constructError, getQueue, JOBS, RESULTS };
