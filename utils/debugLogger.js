function debugLog(...args) {
  if (process.env.DEBUG_AUDIO === 'true') {
    console.log('🛠️', ...args);
  }
}

module.exports = debugLog;
