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

        // Initialize a flag to check the registration status
        let allChannelsRegistered = true;

        // Iterate through all channels in the guild's cache
        client.channels.cache.each(channel => {
            if (channel.type === 'GUILD_TEXT') { // Make sure it's a text channel
                if (channelMappings[channel.name]) {
                    client[channelMappings[channel.name]] = channel.id;
                    console.log(`Channel ${channel.name} registered with ID ${channel.id}.`);
                }
            }
        });

        // Check if all channels were found and registered
        for (const key in channelMappings) {
            if (!client[channelMappings[key]]) {
                console.warn(`Warning: '${key}' channel not found and is not registered.`);
                allChannelsRegistered = false;
            }
        }

        // Log the final status of channel registration
        if (allChannelsRegistered) {
            console.log("All channels were successfully registered.");
        } else {
            console.error("One or more channels could not be found and registered. Check channel names and server settings.");
        }

        // Return the registration status
        return allChannelsRegistered;
    }
};
