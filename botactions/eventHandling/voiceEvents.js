const { VoiceLog } = require('../../config/database');

module.exports = {
    handleVoiceStateUpdate: async function(oldState, newState) {
        const userId = oldState.id || newState.id; // Ensure userId is captured correctly
        const newChannelId = newState.channelId;
        const oldChannelId = oldState.channelId;
        const serverId = oldState.guild.id || newState.guild.id; // Ensure serverId is captured correctly

        console.log(`Voice state update: oldChannelId = ${oldChannelId}, newChannelId = ${newChannelId}`);

        if (!oldChannelId && newChannelId) {
            // User joined a voice channel
            await VoiceLog.create({
                user_id: userId,
                event_type: 'voice_join',
                channel_id: newChannelId,
                server_id: serverId,
                start_time: new Date(),
            });
            console.log(`User ${userId} joined channel ${newChannelId}`);
        } else if (oldChannelId && !newChannelId) {
            // User left a voice channel
            const joinLog = await VoiceLog.findOne({
                where: {
                    user_id: userId,
                    event_type: 'voice_join',
                    channel_id: oldChannelId,
                },
                order: [['timestamp', 'DESC']]
            });

            if (joinLog) {
                const joinTimestamp = new Date(joinLog.timestamp);
                const leaveTimestamp = new Date();
                const duration = (leaveTimestamp - joinTimestamp) / 1000; // Duration in seconds

                await VoiceLog.create({
                    user_id: userId,
                    event_type: 'voice_leave',
                    channel_id: oldChannelId,
                    duration: duration,
                    server_id: serverId,
                    start_time: joinTimestamp,
                    end_time: leaveTimestamp,
                });
                console.log(`User ${userId} left channel ${oldChannelId}`);
            }
        } else if (oldChannelId && newChannelId && oldChannelId !== newChannelId) {
            // User switched voice channels
            console.log(`User ${userId} switched from channel ${oldChannelId} to channel ${newChannelId}`);
            const joinLog = await VoiceLog.findOne({
                where: {
                    user_id: userId,
                    event_type: 'voice_join',
                    channel_id: oldChannelId,
                },
                order: [['timestamp', 'DESC']]
            });

            if (joinLog) {
                const joinTimestamp = new Date(joinLog.timestamp);
                const switchTimestamp = new Date();
                const duration = (switchTimestamp - joinTimestamp) / 1000; // Duration in seconds

                // Log leave event for the old channel
                await VoiceLog.create({
                    user_id: userId,
                    event_type: 'voice_leave',
                    channel_id: oldChannelId,
                    duration: duration,
                    server_id: serverId,
                    start_time: joinTimestamp,
                    end_time: switchTimestamp,
                });
                console.log(`Logged leave for user ${userId} from channel ${oldChannelId}`);

                // Log join event for the new channel
                await VoiceLog.create({
                    user_id: userId,
                    event_type: 'voice_join',
                    channel_id: newChannelId,
                    server_id: serverId,
                    start_time: switchTimestamp,
                });
                console.log(`Logged join for user ${userId} to channel ${newChannelId}`);
            } else {
                // If there is no join log, create a new join log for the new channel
                await VoiceLog.create({
                    user_id: userId,
                    event_type: 'voice_join',
                    channel_id: newChannelId,
                    server_id: serverId,
                    start_time: new Date(),
                });
                console.log(`No join log found for channel ${oldChannelId}, logged join for user ${userId} to channel ${newChannelId}`);
            }
        }
    }
};
