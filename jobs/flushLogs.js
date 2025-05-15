// jobs/flushLogs.js
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../logs/bot.log');

async function flushLogs() {
    if (!globalClient || pendingLogs.length === 0) return;
  
    if (isFlushingLogs) return;
    isFlushingLogs = true;
  
    try {
      const channelId = globalClient?.chanBotLog;
      if (!channelId) return;
  
      const channel = globalClient.channels.cache.get(channelId);
      if (!channel) return;
  
      let batch = pendingLogs.splice(0, 15).join('\n');
  
      if (batch.length > 1900) {
        batch = batch.slice(0, 1900) + '...';
      }
  
      await channel.send({ content: `\	\	\	\	${batch}` });
  
    } catch (err) {
      origConsoleError('❌ Failed to flush logs to Discord:', err);
    } finally {
      isFlushingLogs = false;
    }
  }

module.exports = { flushLogs };
d