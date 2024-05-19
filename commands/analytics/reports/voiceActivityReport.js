const { sequelize, VoiceLog } = require('../../config/database');
const { formatTime } = ('../../../botactions/utilityFunctions')
const { Op } = require('sequelize');

async function generateVoiceActivityReport(serverId) {
    const joins = await VoiceLog.findAll({
        attributes: ['channel_id', 'user_id', 'timestamp'],
        where: {
            server_id: serverId,
            event_type: 'voice_join',
            timestamp: {
                [Op.gte]: sequelize.literal("NOW() - INTERVAL 7 DAY")
            }
        },
        order: [['timestamp', 'ASC']]
    });

    const leaves = await VoiceLog.findAll({
        attributes: ['channel_id', 'user_id', 'timestamp'],
        where: {
            server_id: serverId,
            event_type: 'voice_leave',
            timestamp: {
                [Op.gte]: sequelize.literal("NOW() - INTERVAL 7 DAY")
            }
        },
        order: [['timestamp', 'ASC']]
    });

    const joinEvents = joins.map(join => ({ ...join.get(), eventType: 'join' }));
    const leaveEvents = leaves.map(leave => ({ ...leave.get(), eventType: 'leave' }));
    const events = [...joinEvents, ...leaveEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const currentTime = new Date();
    const channelData = {};

    for (const event of events) {
        if (!channelData[event.channel_id]) {
            channelData[event.channel_id] = { users: new Set(), peakUsers: 0, totalUserTime: 0, totalActiveTime: 0, lastTimestamp: new Date(event.timestamp) };
        }
        const channel = channelData[event.channel_id];

        if (channel.users.size > 0) {
            const duration = (new Date(event.timestamp) - channel.lastTimestamp) / 1000;
            if (duration >= 0) {
                channel.totalUserTime += duration * channel.users.size;
                channel.totalActiveTime += duration;
            }
        }

        channel.lastTimestamp = new Date(event.timestamp);

        if (event.eventType === 'join') {
            channel.users.add(event.user_id);
            channel.peakUsers = Math.max(channel.peakUsers, channel.users.size);
        } else if (event.eventType === 'leave') {
            if (channel.users.has(event.user_id)) {
                channel.users.delete(event.user_id);
            }
        }
    }

    for (const channelId in channelData) {
        const channel = channelData[channelId];
        if (channel.users.size > 0) {
            const duration = (currentTime - channel.lastTimestamp) / 1000;
            channel.totalUserTime += duration * channel.users.size;
            channel.totalActiveTime += duration;
        }
    }

    const results = [];

    for (const channelId in channelData) {
        const { peakUsers, totalUserTime, totalActiveTime } = channelData[channelId];
        const averageUsers = (totalActiveTime > 0) ? totalUserTime / totalActiveTime : "N/A";
        results.push({
            channel_id: channelId,
            peak_users: peakUsers,
            average_users: averageUsers !== "N/A" ? Math.ceil(averageUsers) : "N/A",
            total_duration: formatTime(totalUserTime)
        });
    }

    return results;
}

module.exports = {
    generateVoiceActivityReport
}