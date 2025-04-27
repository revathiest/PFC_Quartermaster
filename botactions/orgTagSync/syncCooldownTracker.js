let lastManualSyncTime = 0;
const cooldownMs = 60 * 60 * 1000; // 1 hour

function canRunManualSync() {
  const now = Date.now();
  return now - lastManualSyncTime > cooldownMs;
}

function markManualSyncRun() {
  lastManualSyncTime = Date.now();
}

module.exports = { canRunManualSync, markManualSyncRun };
