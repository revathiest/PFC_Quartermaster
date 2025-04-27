const { syncOrgTags } = require('./syncOrgTags');

function startOrgTagSyncScheduler(client) {
  const twelveHours = 12 * 60 * 60 * 1000;

  async function runSync() {
    console.log('[SYNC] Starting scheduled org tag sync.');
    await syncOrgTags(client);
    console.log('[SYNC] Completed scheduled sync.');
  }

  setInterval(runSync, twelveHours);
  runSync(); // Run immediately at startup as well (optional)
}

module.exports = { startOrgTagSyncScheduler };
