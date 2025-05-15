// jobs/index.js

const { scheduleDailyApiSync } = require('./scheduler');
const { flushLogs } = require('./flushLogs');
const { checkEvents } = require('../botactions/scheduled/checkEvents');
const { deleteOldLogs } = require('../botactions/maintenance/logCleanup');

/**
 * Kick off all scheduled and interval-based tasks.
 * This should be called after the Discord client is fully ready.
 */
function startAllScheduledJobs(client) {
  // Time-based sync job (runs daily at 04:00 UTC)
  scheduleDailyApiSync(4, 0);

  // Interval jobs
  setInterval(() => flushLogs(), 2000);               // Every 2 seconds
  setInterval(() => checkEvents(client), 60000);      // Every 1 minute
  setInterval(() => deleteOldLogs(client), 86400000); // Every 24 hours
}

module.exports = { startAllScheduledJobs };
