// jobs/flushLogs.js
const fs = require('fs');
const path = require('path');
let pendingLogs = [];
let isFlushinglogs = false;

async function flushLogs({client}) {
    if (!client || pendingLogs.length === 0) return;
  
    if (isFlushinglogs) return;
    isFlushingLogs = true;
  
    try {
      const channelId = client?.chanBotLog;
      if (!channelId) return;
  
      const channel = client.channels.cache.get(channelId);
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