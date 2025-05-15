const { runFullApiSync } = require('../utils/syncApiData');

function scheduleDailyApiSync(hour = 4, minute = 0) {
  const now = new Date();
  const next = new Date();

  next.setUTCHours(hour, minute, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1); // schedule for tomorrow

  const msUntilNextRun = next - now;

  console.log(`[SCHEDULER] Next sync scheduled for ${next.toISOString()} (${Math.round(msUntilNextRun / 1000)}s)`);

  setTimeout(() => {
    runAndRepeat(); // initial run
    setInterval(runAndRepeat, 24 * 60 * 60 * 1000); // repeat every 24 hours
  }, msUntilNextRun);

  async function runAndRepeat() {
    try {
      console.log('[SCHEDULER] Running scheduled API sync...');
      await runFullApiSync();
    } catch (err) {
      console.error('[SCHEDULER ERROR] API sync failed:', err);
    }
  }
}

module.exports = { scheduleDailyApiSync };
