// jobs/flushLogs.js
const { pendingLogs, isFlushingLogs } = require('./logState');

async function flushLogs(client) {
    console.log(`🧪 flushLogs called. Queue length: ${pendingLogs.length}, client: ${!!client}`);

    if (!client || pendingLogs.length === 0) return;
  
    if (isFlushingLogs.value) return;
    isFlushingLogs.value = true;
    console.log('🌀 Flushing logs...');
  
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
      isFlushingLogs.value = false;
      console.log('✅ Log flush complete.');
    }
  }

module.exports = { flushLogs };