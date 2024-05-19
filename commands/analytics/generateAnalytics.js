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
    // Fetch voice join events from the past 7 days
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

    // Fetch voice leave events from the past 7 days
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

    // Process each join event
    for (const join of joins) {
        // Initialize channel data if not already present
        if (!channelData[join.channel_id]) {
            channelData[join.channel_id] = { users: new Set(), peakUsers: 0, totalDuration: 0, totalUserTime: 0, lastTimestamp: join.timestamp };
        }
        // Add the user to the channel's user set
        channelData[join.channel_id].users.add(join.user_id);
        // Update peak users if current number of users exceeds previous peak
        channelData[join.channel_id].peakUsers = Math.max(channelData[join.channel_id].peakUsers, channelData[join.channel_id].users.size);
        // Calculate the duration since the last event and update total user time
        if (channelData[join.channel_id].users.size > 0) {
            const duration = (new Date(join.timestamp) - new Date(channelData[join.channel_id].lastTimestamp)) / 1000;
            channelData[join.channel_id].totalUserTime += duration * channelData[join.channel_id].users.size - 1;
            channelData[join.channel_id].lastTimestamp = join.timestamp;
        }
    }

    // Process each leave event
    for (const leave of leaves) {
        if (channelData[leave.channel_id] && channelData[leave.channel_id].users.has(leave.user_id)) {
            const duration = (new Date(leave.timestamp) - new Date(channelData[leave.channel_id].lastTimestamp)) / 1000;
            channelData[leave.channel_id].totalUserTime += duration * channelData[leave.channel_id].users.size + 1;
            channelData[leave.channel_id].users.delete(leave.user_id);
            channelData[leave.channel_id].lastTimestamp = leave.timestamp;
        }
    }

    // Handle users still in the voice chat
    for (const channelId in channelData) {
        if (channelData[channelId].users.size > 0) {
            const duration = (currentTime - new Date(channelData[channelId].lastTimestamp)) / 1000;
            channelData[channelId].totalUserTime += duration * channelData[channelId].users.size;
        }
    }

    const results = [];

    // Calculate the average users and prepare the final results
    for (const channelId in channelData) {
        const { peakUsers, totalUserTime, lastTimestamp } = channelData[channelId];
        const activeDuration = (currentTime - new Date(lastTimestamp)) / 1000;
        const averageUsers = totalUserTime / activeDuration || "N/A";
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

module.exports = {
    generateUsageReport,
    generateVoiceActivityReport,
    generateReportByChannel
};

// Helper function to format time in HH:MM:SS
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
