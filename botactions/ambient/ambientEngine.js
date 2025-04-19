// botactions/ambient/ambientEngine.js
const { AmbientMessage } = require('../../config/database');

const channelActivity = new Map(); // channelId => { count, lastSent }

function trackChannelActivity(message) {
    if (!message.guild || message.author.bot) return;

    const id = message.channel.id;
    const now = Date.now();
    const data = channelActivity.get(id) || { count: 0, lastSent: 0 };

    data.count += 1;
    channelActivity.set(id, data);
}

function getIntervalForActivity(count) {
    if (count > 50) return 10 * 60 * 1000;   // 10 min
    if (count > 20) return 30 * 60 * 1000;   // 30 min
    if (count > 5)  return 60 * 60 * 1000;   // 1 hour
    return null; // not active enough
}

async function sendAmbientMessages(client) {
    const now = Date.now();

    for (const [channelId, data] of channelActivity.entries()) {
        const interval = getIntervalForActivity(data.count);
        if (!interval) continue;

        const sinceLast = now - data.lastSent;
        if (sinceLast < interval) continue;

        const channel = client.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased?.()) continue;

        try {
            const messages = await AmbientMessage.findAll();
            if (!messages.length) return;

            const msg = messages[Math.floor(Math.random() * messages.length)];
            await channel.send(msg.content);

            data.lastSent = now;
            data.count = 0;
            channelActivity.set(channelId, data);

            console.log(`💬 Sent ambient message to #${channel.name}`);
        } catch (err) {
            console.error(`❌ Failed to send ambient message to channel ${channelId}:`, err);
        }
    }
}

function startAmbientEngine(client) {
    // Hook into message tracking
    client.on('messageCreate', trackChannelActivity);

    // Start message loop
    setInterval(() => sendAmbientMessages(client), 60 * 1000); // every 60 seconds
    console.log('🌀 Ambient engine started');
}

module.exports = { startAmbientEngine };
