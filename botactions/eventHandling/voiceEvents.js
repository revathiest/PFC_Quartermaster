const { VoiceLog } = require('../../config/database');

module.exports = {
    handleVoiceStateUpdate: async function(oldState, newState) {
        const userId = newState.id;
        const channelId = newState.channelId;
        const serverId = newState.guild.id;

        if (!oldState.channelId && newState.channelId) {
            // User joined a voice channel
            await VoiceLog.create({
                user_id: userId,
                event_type: 'voice_join',
                channel_id: channelId,
                server_id: serverId,
                start_time: new Date(),
            });
        } else if (oldState.channelId && !newState.channelId) {
            // User left a voice channel
            const joinLog = await VoiceLog.findOne({
                where: {
                    user_id: userId,
                    event_type: 'voice_join',
                    channel_id: oldState.channelId,
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
                    channel_id: oldState.channelId,
                    duration: duration,
                    server_id: serverId,
                    start_time: joinTimestamp,
                    end_time: leaveTimestamp,
                });
            }
        }
    }
};
