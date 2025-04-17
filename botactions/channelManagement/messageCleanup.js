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
                console.log(`🔄 Processing channel ID: ${channelInfo.channelId}`);

                let channel;
                try {
                    channel = await client.channels.fetch(channelInfo.channelId);
                } catch (fetchErr) {
                    console.error(`⚠️ Could not fetch channel ${channelInfo.channelId}:`, fetchErr);
                    continue;
                }

                if (channel && (channel.type === 0 || channel.type === 5)) {
                    console.log(`📨 Fetching messages in #${channel.name}`);

                    let messages;
                    try {
                        messages = await channel.messages.fetch({ limit: 100 });
                    } catch (msgErr) {
                        console.error(`⚠️ Error fetching messages from #${channel.name}:`, msgErr);
                        continue;
                    }

                    const purgeTime = new Date();
                    purgeTime.setDate(purgeTime.getDate() - channelInfo.purgeTimeInDays);
                    console.log(`📅 Deleting messages older than: ${purgeTime.toISOString()}`);

                    const messagesToDelete = messages.filter(msg =>
                        !msg.pinned && msg.createdTimestamp <= purgeTime.getTime()
                    );

                    const deletable = messagesToDelete.filter(msg =>
                        Date.now() - msg.createdTimestamp <= 14 * 24 * 60 * 60 * 1000
                    );
                    const tooOld = messagesToDelete.filter(msg =>
                        Date.now() - msg.createdTimestamp > 14 * 24 * 60 * 60 * 1000
                    );

                    if (deletable.size > 0) {
                        try {
                            await channel.bulkDelete(deletable, true);
                            console.log(`✅ Bulk deleted ${deletable.size} messages in #${channel.name}`);
                        } catch (deleteErr) {
                            console.error(`❌ Error during bulk delete in #${channel.name}:`, deleteErr);
                        }
                    }

                    if (tooOld.size > 0) {
                        console.log(`⏳ Deleting ${tooOld.size} old messages individually in #${channel.name}`);
                        function delay(ms) {
                            return new Promise(resolve => setTimeout(resolve, ms));
                        }
                        
                        for (const [id, msg] of tooOld) {
                            try {
                                await msg.delete();
                                console.log(`🗑️ Deleted old message: ${msg.id}`);
                                await delay(1000); // 1 second pause between deletes
                            } catch (err) {
                                console.error(`❌ Failed to delete old message ${msg.id}:`, err);
                                await delay(1500); // wait longer after an error, just in case
                            }
                        }
                        
                    }

                    if (deletable.size === 0 && tooOld.size === 0) {
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
