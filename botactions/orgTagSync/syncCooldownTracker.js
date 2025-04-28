let lastManualSyncTime = null; // 🟢 null means "never run"
const cooldownMs = 60 * 60 * 1000; // 1 hour

function canRunManualSync(now = Date.now()) {
  if (lastManualSyncTime === null) {
    return true; // First run allowed!
  } else {
    return now - lastManualSyncTime > cooldownMs;
  }
}

function markManualSyncRun(now = Date.now()) {
  lastManualSyncTime = now;
}

function resetManualSyncTracker() {
  lastManualSyncTime = null;
}

module.exports = { 
  canRunManualSync, 
  markManualSyncRun, 
  resetManualSyncTracker 
};
