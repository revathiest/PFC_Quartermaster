const { sequelize, UsageLog, VoiceLog } = require('../../config/database');
const { Op } = require('sequelize');

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

    const currentTime = new Date();
    const channelData = {};

    for (const join of joins) {
        if (!channelData[join.channel_id]) {
            channelData[join.channel_id] = { users: new Set(), peakUsers: 0, totalDuration: 0, totalUserTime: 0, lastTimestamp: join.timestamp };
        }
        channelData[join.channel_id].users.add(join.user_id);
        channelData[join.channel_id].peakUsers = Math.max(channelData[join.channel_id].peakUsers, channelData[join.channel_id].users.size);
        if (channelData[join.channel_id].users.size > 0) {
            const duration = (new Date(join.timestamp) - new Date(channelData[join.channel_id].lastTimestamp)) / 1000;
            channelData[join.channel_id].totalUserTime += duration * channelData[join.channel_id].users.size;
            channelData[join.channel_id].lastTimestamp = join.timestamp;
        }
    }

    for (const leave of leaves) {
        if (channelData[leave.channel_id] && channelData[leave.channel_id].users.has(leave.user_id)) {
            const duration = (new Date(leave.timestamp) - new Date(channelData[leave.channel_id].lastTimestamp)) / 1000;
            channelData[leave.channel_id].totalUserTime += duration * channelData[leave.channel_id].users.size;
            channelData[leave.channel_id].users.delete(leave.user_id);
            channelData[leave.channel_id].lastTimestamp = leave.timestamp;
        }
    }

    // Handle users still in voice chat
    for (const channelId in channelData) {
        if (channelData[channelId].users.size > 0) {
            const duration = (currentTime - new Date(channelData[channelId].lastTimestamp)) / 1000;
            channelData[channelId].totalUserTime += duration * channelData[channelId].users.size;
        }
    }

    const results = [];

    for (const channelId in channelData) {
        const { peakUsers, totalUserTime, lastTimestamp } = channelData[channelId];
        const activeDuration = (currentTime - new Date(lastTimestamp)) / 1000;
        const averageUsers = totalUserTime / activeDuration || "N/A";
        results.push({
            channel_id: channelId,
            peak_users: peakUsers,
            average_users: averageUsers !== "N/A" ? Math.ceil(averageUsers) : "N/A",
            total_duration: totalUserTime.toFixed(2) // rounded to 2 decimal places
        });
    }

    return results;
}

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

module.exports = {
    generateUsageReport,
    generateVoiceActivityReport,
    generateReportByChannel
};
