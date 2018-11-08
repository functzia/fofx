const redis = require('async-redis');
const uuid = require('uuid');

class DistributedNanoState {
  constructor(client, key) {
    this._client = client;
    this._key = key;
  }

  async get() {
    const rawState = await this._client.get(this._key);
    if (rawState == null) {
      return null;
    }
    return JSON.parse(rawState);
  }

  async set(state) {
    return this._client.set(this._key, JSON.stringify(state));
  }
}

module.exports = function(redisUrl) {
  const client = redis.createClient(redisUrl);
  const nanoStates = {};
  return nano => {
    if (!nanoStates[nano]) {
      nanoStates[nano] = new DistributedNanoState(client, `${uuid()}//${nano}`);
    }
    return nanoStates[nano];
  };
};
