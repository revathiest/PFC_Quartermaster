const { syncOrgTags } = require('./syncOrgTags');

function startOrgTagSyncScheduler(client) {
  const twelveHours = 12 * 60 * 60 * 1000;

  async function runSync() {
    console.log('🔁 Starting scheduled org tag sync...');
    await syncOrgTags(client);
    console.log('✅ Scheduled org tag sync complete.');
  }

  setInterval(runSync, twelveHours);
  runSync(); // Run immediately at startup as well (optional)
}

module.exports = { startOrgTagSyncScheduler };
