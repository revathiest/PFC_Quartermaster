const { voiceLog } = require('../../config/database');

module.exports = {
    handleVoiceStateUpdate: async function(oldState, newState) {
        const userId = newState.id;
        const channelId = newState.channelId;

        if (!oldState.channelId && newState.channelId) {
            // User joined a voice channel
            await voiceLog.create({
                user_id: userId,
                event_type: 'voice_join',
                event_data: JSON.stringify({ channel_id: channelId })
            });
        } else if (oldState.channelId && !newState.channelId) {
            // User left a voice channel
            const joinLog = await VoiceLog.findOne({
                where: {
                    user_id: userId,
                    event_type: 'voice_join',
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
                    event_data: JSON.stringify({ channel_id: oldState.channelId, duration }),
                });
            }
        }
    }
};
