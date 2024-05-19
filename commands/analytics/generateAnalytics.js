const { sequelize, UsageLog, VoiceLog } = require('../../config/database');
const { Op } = require('sequelize');

// Function to generate a usage report for the past 7 days
async function generateUsageReport(serverId) {
    const results = await UsageLog.findAll({
        attributes: [
            'channel_id',
            [sequelize.fn('COUNT', sequelize.col('event_type')), 'event_count']
        ],
        where: {
            server_id: serverId,
            timestamp: {
                [Op.gte]: sequelize.literal("NOW() - INTERVAL 7 DAY")
            }
        },
        group: ['channel_id'],
        order: [[sequelize.fn('COUNT', sequelize.col('event_type')), 'DESC']],
    });

    return results.map(result => result.get());
}

// Function to generate a voice activity report for the past 7 days
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

// Function to generate a report for a specific channel
async function generateReportByChannel(serverId, channelId) {
    const results = await UsageLog.findAll({
        attributes: [
            'event_type',
            [sequelize.fn('COUNT', sequelize.col('event_type')), 'event_count']
        ],
        where: {
            server_id: serverId,
            channel_id: channelId,
            timestamp: {
                [Op.gte]: sequelize.literal("NOW() - INTERVAL 7 DAY")
            }
        },
        group: ['event_type'],
        order: [[sequelize.fn('COUNT', sequelize.col('event_type')), 'DESC']],
    });

    return results.map(result => result.get());
}

// Helper function to format time in HH:MM:SS
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

module.exports = {
    generateUsageReport,
    generateVoiceActivityReport,
    generateReportByChannel
};
