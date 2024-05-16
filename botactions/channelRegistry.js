module.exports = {
    registerChannels: function (client) {
        // Define all the channel names and their corresponding property names on the client object
        const channelMappings = {
            'star-citizen-news': 'chanSCNews',
            'pfc-bot-testing': 'chanBotTest',
            'pfc-bot-activity-log': 'chanBotLog',
            'profanity-alert': 'chanProfanityAlert',
            'division-signup': 'chanDivSignup'
        };

        // Iterate through all channels in the guild's cache
        for (const channel of client.channels.cache.values()) {
            if (channel.type === 'GUILD_TEXT') { // Make sure it's a text channel
                if (channelMappings[channel.name]) {
                    client[channelMappings[channel.name]] = channel.id;
                    console.log(`Channel ${channel.name} registered with ID ${channel.id}.`);
                }
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
