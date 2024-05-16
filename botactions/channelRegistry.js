// channelRegistry.js
const { Client } = require('discord.js');

module.exports = {
    registerChannels: async function (client) {
        const channelMappings = {
            'star-citizen-news': 'chanSCNews',
            'pfc-bot-testing': 'chanBotTest',
            'pfc-bot-activity-log': 'chanBotLog',
            'profanity-alert': 'chanProfanityAlert',
            'division-signup': 'chanDivSignup'
        };

        // Ensure all channels are fetched
        await client.channels.fetch();

        // Register each channel based on mappings
        for (const channel of client.channels.cache.values()) {
            if (channel.type === 'GUILD_TEXT' && channelMappings[channel.name]) {
                client[channelMappings[channel.name]] = channel.id;
                console.log(`Channel ${channel.name} registered with ID ${channel.id}.`);
            }
        }

        // Check if all channels were found and registered
        for (const key in channelMappings) {
            if (!client[channelMappings[key]]) {
                console.warn(`Warning: ${key} channel not found and is not registered.`);
            }
        }
    }
};
