const { AmbientMessage, AmbientChannel, AmbientSetting } = require('../../config/database');

const channelActivity = new Map(); // channelId => { count, lastSent, sinceLastBot, lastMessage }
const allowedChannelIds = new Set(); // Only allow ambient in these channels

let ambientConfig = {
    minMessagesSinceLast: 5,
    freshWindowMs: 3 * 60 * 1000, // 3 minutes
};

async function refreshAllowedChannels() {
    try {
        const entries = await AmbientChannel.findAll();
        allowedChannelIds.clear();
        for (const entry of entries) {
            allowedChannelIds.add(String(entry.channelId));
        }
        console.log(`✅ Loaded ${allowedChannelIds.size} allowed ambient channels.`);
    } catch (err) {
        console.error('❌ Failed to load allowed ambient channels:', err);
    }
}

async function refreshAmbientSettings() {
    try {
        const setting = await AmbientSetting.findOne();
        if (setting) {
            ambientConfig.minMessagesSinceLast = setting.minMessagesSinceLast;
            ambientConfig.freshWindowMs = setting.freshWindowMs;
            console.log(`🔧 Loaded ambient config → minMessagesSinceLast: ${setting.minMessagesSinceLast}, freshWindowMs: ${setting.freshWindowMs}`);
        } else {
            console.warn('⚠️ No ambient settings found in DB. Using defaults.');
        }
    } catch (err) {
        console.error('❌ Failed to load ambient settings:', err);
    }
}

function trackChannelActivity(message) {
    if (message.author.bot) return;

    const channelId = message.channel.id;
    if (!allowedChannelIds.has(channelId)) {
        return;
    }

    const now = Date.now();
    const data = channelActivity.get(channelId) || {
        count: 0,
        lastSent: 0,
        sinceLastBot: 0,
        lastMessage: 0,
    };

    data.count += 1;
    data.sinceLastBot += 1;
    data.lastMessage = now;

    channelActivity.set(channelId, data);
}

async function sendAmbientMessages(client) {
    const now = Date.now();

    for (const [channelId, data] of channelActivity.entries()) {
        const channel = client.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased?.()) {
            continue;
        }

        if (!allowedChannelIds.has(channelId)) {
            continue;
        }

        const timeSinceLastPost = now - data.lastSent;
        const timeSinceLastMessage = now - data.lastMessage;

        const fresh = timeSinceLastMessage < ambientConfig.freshWindowMs;
        const enough = data.sinceLastBot >= ambientConfig.minMessagesSinceLast;

        if (!fresh || !enough) {
            continue;
        }

        try {
            const messages = await AmbientMessage.findAll();
            if (!messages.length) {
                console.warn(`⚠️ No ambient messages available in DB.`);
                return;
            }

            const msg = messages[Math.floor(Math.random() * messages.length)];
            await channel.send(msg.content);

            data.lastSent = now;
            data.count = 0;
            data.sinceLastBot = 0;
            channelActivity.set(channelId, data);

            console.log(`✅ Ambient message sent to #${channel.name}`);
        } catch (err) {
            console.error(`❌ Failed to send message to #${channel.name}`, err);
        }
    }

    console.log(`✅ [ENGINE COMPLETE] ${new Date().toISOString()}\n`);
}

async function startAmbientEngine(client) {
    console.log('🌀 Ambient engine starting...');
    await refreshAllowedChannels();
    await refreshAmbientSettings();

    setInterval(() => sendAmbientMessages(client), 60 * 1000);
    setInterval(refreshAllowedChannels, 5 * 60 * 1000);
    setInterval(refreshAmbientSettings, 5 * 60 * 1000);

    console.log('🚀 Ambient engine fully online.');
}

module.exports = {
    startAmbientEngine,
    trackChannelActivity,
};