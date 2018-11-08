class LocalNanoState {
  constructor() {
    this._state = null;
  }

  async get() {
    return this._state;
  }

  async set(state) {
    this._state = state;
  }
}

const nanoStates = {};

module.exports = function getNanoState(nano) {
  if (!nanoStates[nano]) {
    nanoStates[nano] = new LocalNanoState();
  }
  return nanoStates[nano];
};
