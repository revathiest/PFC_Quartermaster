const { AmbientMessage, AmbientChannel } = require('../../config/database');

const channelActivity = new Map(); // channelId => { count, lastSent, sinceLastBot, lastMessage }
const allowedChannelIds = new Set();

const MIN_MESSAGES_SINCE_LAST = 5;
const FRESH_WINDOW = 3 * 60 * 1000; // 3 minutes

async function refreshAllowedChannels() {
    try {
        const entries = await AmbientChannel.findAll();
        allowedChannelIds.clear();
        for (const entry of entries) {
            allowedChannelIds.add(entry.channelId);
        }
        console.log(`✅ Loaded ${allowedChannelIds.size} allowed ambient channels.`);
    } catch (err) {
        console.error('❌ Failed to load allowed ambient channels:', err);
    }
}

function trackChannelActivity(message) {
    if (!message.guild || message.author.bot) return;
    if (!allowedChannelIds.has(message.channel.id)) return;

    const id = message.channel.id;
    const now = Date.now();
    const data = channelActivity.get(id) || {
        count: 0,
        lastSent: 0,
        sinceLastBot: 0,
        lastMessage: 0,
    };

    data.count += 1;
    data.sinceLastBot += 1;
    data.lastMessage = now;

    channelActivity.set(id, data);
}

function getIntervalForActivity(count) {
    if (count > 50) return 10 * 60 * 1000;   // 10 min
    if (count > 20) return 30 * 60 * 1000;   // 30 min
    if (count > 5)  return 60 * 60 * 1000;   // 1 hour
    return null;
}

async function sendAmbientMessages(client) {
    const now = Date.now();

    for (const [channelId, data] of channelActivity.entries()) {
        if (!allowedChannelIds.has(channelId)) continue;

        const interval = getIntervalForActivity(data.count);
        if (!interval) continue;

        const sinceLast = now - data.lastSent;
        if (sinceLast < interval) continue;

        const freshActivity = now - data.lastMessage < FRESH_WINDOW;
        const enoughMessages = data.sinceLastBot >= MIN_MESSAGES_SINCE_LAST;

        if (!freshActivity || !enoughMessages) continue;

        const channel = client.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased?.()) continue;

        try {
            const messages = await AmbientMessage.findAll();
            if (!messages.length) return;

            const msg = messages[Math.floor(Math.random() * messages.length)];
            await channel.send(msg.content);

            data.lastSent = now;
            data.count = 0;
            data.sinceLastBot = 0;
            channelActivity.set(channelId, data);

            console.log(`💬 Sent ambient message to #${channel.name}`);
        } catch (err) {
            console.error(`❌ Failed to send ambient message to channel ${channelId}:`, err);
        }
    }
}

function startAmbientEngine(client) {
    client.on('messageCreate', trackChannelActivity);
    setInterval(() => sendAmbientMessages(client), 60 * 1000);
    refreshAllowedChannels();
    setInterval(refreshAllowedChannels, 5 * 60 * 1000);

    console.log('🌀 Ambient engine started');
}

module.exports = { startAmbientEngine };
