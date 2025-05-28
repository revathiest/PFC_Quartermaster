const store = new Map();

module.exports = {
  get(key) {
    return store.get(key);
  },
  set(key, value) {
    store.set(key, value);
  },
  delete(key) {
    store.delete(key);
  },
  clear() {
    store.clear();
  }
};
