module.exports = {
    registerChannels: function (client) {

        const channelMappings = {
            'star-citizen-news': 'chanSCNews',
            'pfc-bot-testing': 'chanBotTest',
            'pfc-bot-activity-log': 'chanBotLog',
            'profanity-alert': 'chanProfanityAlert',
            'division-signup': 'chanDivSignup',
            '🔥-pfc-lobby': 'chanLobby'
        };

        let allChannelsRegistered = true;

        client.channels.cache.each(channel => {
            if (channel.type === 0 && channelMappings[channel.name]) {
                client[channelMappings[channel.name]] = channel.id;
                console.log(`Channel ${channel.name} registered with ID ${channel.id}.`);
            }
        });

        for (const key in channelMappings) {
            if (!client[channelMappings[key]]) {
                console.warn(`Warning: '${key}' channel not found and is not registered.`);
                allChannelsRegistered = false;
            }
        }

        if (allChannelsRegistered) {
            console.log("All channels were successfully registered.");
        } else {
            console.error("One or more channels could not be found and registered. Check channel names and server settings.");
        }

        return allChannelsRegistered;
    }
};
