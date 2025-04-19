const { VoiceLog } = require('../../config/database');
const { getChannelNameById, getUserNameById } = require('../../botactions/utilityFunctions');

module.exports = {
    handleVoiceStateUpdate: async function(oldState, newState, client) {
        const userId = oldState.id || newState.id;
        const newChannelId = newState.channelId;
        const oldChannelId = oldState.channelId;
        const serverId = oldState.guild.id || newState.guild.id;

        const newChannelName = newChannelId ? await getChannelNameById(newChannelId, client).catch(() => null) : null;
        const oldChannelName = oldChannelId ? await getChannelNameById(oldChannelId, client).catch(() => null) : null;
        const userName = userId ? await getUserNameById(userId, client).catch(() => null) : null;

        console.log(`🎧 Voice state update: old = ${oldChannelName}, new = ${newChannelName}`);

        if (!oldChannelId && newChannelId) {
            await VoiceLog.create({
                user_id: userId,
                event_type: 'voice_join',
                channel_id: newChannelId,
                server_id: serverId,
                start_time: new Date(),
            });
            console.log(`➕ ${userName} joined voice channel: ${newChannelName}`);
        } else if (oldChannelId && !newChannelId) {
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
                const duration = (leaveTimestamp - joinTimestamp) / 1000;

                await VoiceLog.create({
                    user_id: userId,
                    event_type: 'voice_leave',
                    channel_id: oldChannelId,
                    duration: duration,
                    server_id: serverId,
                    start_time: joinTimestamp,
                    end_time: leaveTimestamp,
                });
                console.log(`➖ ${userName} left voice channel: ${oldChannelName}`);
            }
        } else if (oldChannelId && newChannelId && oldChannelId !== newChannelId) {
            console.log(`🔁 ${userName} moved from ${oldChannelName} to ${newChannelName}`);
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
                const duration = (switchTimestamp - joinTimestamp) / 1000;

                await VoiceLog.create({
                    user_id: userId,
                    event_type: 'voice_leave',
                    channel_id: oldChannelId,
                    duration: duration,
                    server_id: serverId,
                    start_time: joinTimestamp,
                    end_time: switchTimestamp,
                });
                console.log(`📤 Logged leave: ${userName} from ${oldChannelName}`);

                await VoiceLog.create({
                    user_id: userId,
                    event_type: 'voice_join',
                    channel_id: newChannelId,
                    server_id: serverId,
                    start_time: switchTimestamp,
                });
                console.log(`📥 Logged join: ${userName} to ${newChannelName}`);
            } else {
                await VoiceLog.create({
                    user_id: userId,
                    event_type: 'voice_join',
                    channel_id: newChannelId,
                    server_id: serverId,
                    start_time: new Date(),
                });
                console.log(`⚠️ No join log found. Logged join: ${userName} to ${newChannelName}`);
            }
        }
    }
};
