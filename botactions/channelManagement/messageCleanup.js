const { SnapChannel } = require('../../config/database');

async function deleteMessages(client) {
    console.log('🧹 Starting snapchannel cleanup process...');

    try {
        for (const [guildId, guild] of client.guilds.cache) {
            console.log(`🔍 Checking guild: ${guild.name} (${guildId})`);

            let channels;
            try {
                channels = await SnapChannel.findAll({ where: { serverId: guildId } });
                console.log(`📋 Found ${channels.length} snapchannels for guild ${guild.name}`);
            } catch (dbErr) {
                console.error(`❌ DB error for guild ${guild.name} (${guildId}):`, dbErr);
                continue;
            }

            for (const channelInfo of channels) {
                console.log(`🔄 Processing channel ID: ${channelInfo.channelId}`); // DEBUG

                let channel;
                try {
                    channel = await client.channels.fetch(channelInfo.channelId);
                } catch (fetchErr) {
                    console.error(`⚠️ Could not fetch channel ${channelInfo.channelId}:`, fetchErr);
                    continue;
                }

                if (channel && (channel.type === 0 || channel.type === 5)) {
                    console.log(`📨 Fetching messages in #${channel.name}`); // DEBUG

                    let messages;
                    try {
                        messages = await channel.messages.fetch({ limit: 100 });
                    } catch (msgErr) {
                        console.error(`⚠️ Error fetching messages from #${channel.name}:`, msgErr);
                        continue;
                    }

                    const purgeTime = new Date();
                    purgeTime.setDate(purgeTime.getDate() - channelInfo.purgeTimeInDays);
                    console.log(`📅 Deleting messages older than: ${purgeTime.toISOString()}`); // DEBUG

                    const messagesToDelete = messages.filter(msg =>
                        !msg.pinned && msg.createdTimestamp <= purgeTime.getTime()
                    );

                    const tooOld = messagesToDelete.filter(msg =>
                        Date.now() - msg.createdTimestamp > 14 * 24 * 60 * 60 * 1000
                    );

                    if (tooOld.size > 0) {
                        console.log(`⚠️ ${tooOld.size} messages too old to bulk delete in #${channel.name}`);
                    }

                    if (messagesToDelete.size > 0) {
                        try {
                            await channel.bulkDelete(messagesToDelete, true);
                            console.log(`✅ Deleted ${messagesToDelete.size} messages in #${channel.name}`);
                        } catch (deleteErr) {
                            console.error(`❌ Error deleting messages in #${channel.name}:`, deleteErr);
                        }
                    } else {
                        console.log(`ℹ️ No messages to delete in #${channel.name}`);
                    }
                } else {
                    console.log(`⚠️ Invalid or unsupported channel type for ID: ${channelInfo.channelId}`);
                }
            }
        }

        console.log('✅ Snapchannel cleanup complete.');
    } catch (error) {
        console.error('🔥 Fatal error during snapchannel cleanup:', error);
    }
}

module.exports = { deleteMessages };
