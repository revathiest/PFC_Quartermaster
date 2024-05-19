const { sequelize, UsageLog, VoiceLog } = require('../../config/database');
const { Op } = require('sequelize');

// Function to generate a usage report for the past 7 days
async function generateUsageReport(serverId) {
    console.log('Starting to generate usage report');

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

    console.log('Finished generating usage report');
    return results.map(result => result.get());
}

// Function to generate a voice activity report for the past 7 days
async function generateVoiceActivityReport(serverId) {
    console.log('Starting to generate voice activity report');

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
    console.log(`Fetched ${joins.length} join events`);

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
    console.log(`Fetched ${leaves.length} leave events`);

    const currentTime = new Date();
    const channelData = {};

    // Process each join event
    for (const join of joins) {
        console.log(`Processing join event: user ${join.user_id} joined channel ${join.channel_id} at ${join.timestamp}`);
        if (!channelData[join.channel_id]) {
            channelData[join.channel_id] = { users: new Set(), peakUsers: 0, totalUserTime: 0, lastTimestamp: new Date(join.timestamp) };
            console.log(`Initialized data for channel ${join.channel_id}`);
        }
        const channel = channelData[join.channel_id];
        
        if (channel.users.size > 0) {
            const duration = (new Date(join.timestamp) - channel.lastTimestamp) / 1000;
            channel.totalUserTime += duration * channel.users.size;
            console.log(`Join event: channel ${join.channel_id}, duration ${duration}s, users ${channel.users.size}, totalUserTime ${channel.totalUserTime}s`);
        }

        channel.lastTimestamp = new Date(join.timestamp);
        channel.users.add(join.user_id);
        console.log(`User ${join.user_id} joined channel ${join.channel_id}, users now: ${channel.users.size}`);

        channel.peakUsers = Math.max(channel.peakUsers, channel.users.size);
        console.log(`Updated peak users for channel ${join.channel_id} to ${channel.peakUsers}`);
    }

    // Process each leave event
    for (const leave of leaves) {
        console.log(`Processing leave event: user ${leave.user_id} left channel ${leave.channel_id} at ${leave.timestamp}`);
        if (channelData[leave.channel_id] && channelData[leave.channel_id].users.has(leave.user_id)) {
            const channel = channelData[leave.channel_id];
            const duration = (new Date(leave.timestamp) - channel.lastTimestamp) / 1000;
            if (duration < 0) {
                console.error(`Negative duration detected: leave timestamp ${leave.timestamp}, lastTimestamp ${channel.lastTimestamp}`);
            }
            channel.totalUserTime += duration * channel.users.size;
            console.log(`Leave event: channel ${leave.channel_id}, duration ${duration}s, users ${channel.users.size}, totalUserTime ${channel.totalUserTime}s`);
            channel.users.delete(leave.user_id);
            channel.lastTimestamp = new Date(leave.timestamp);
            console.log(`User ${leave.user_id} left channel ${leave.channel_id}, users now: ${channel.users.size}`);
        }
    }

    // Handle users still in the voice chat
    for (const channelId in channelData) {
        const channel = channelData[channelId];
        if (channel.users.size > 0) {
            const duration = (currentTime - channel.lastTimestamp) / 1000;
            channel.totalUserTime += duration * channel.users.size;
            console.log(`Ongoing session: channel ${channelId}, duration ${duration}s, users ${channel.users.size}, totalUserTime ${channel.totalUserTime}s`);
        }
    }

    const results = [];

    // Calculate the average users and prepare the final results
    for (const channelId in channelData) {
        const { peakUsers, totalUserTime, lastTimestamp } = channelData[channelId];
        const activeDuration = (currentTime - lastTimestamp) / 1000;
        const averageUsers = (activeDuration > 0) ? totalUserTime / activeDuration : "N/A";
        console.log(`Channel ${channelId} summary: peakUsers ${peakUsers}, totalUserTime ${totalUserTime}s, activeDuration ${activeDuration}s, averageUsers ${averageUsers}`);
        results.push({
            channel_id: channelId,
            peak_users: peakUsers,
            average_users: averageUsers !== "N/A" ? Math.ceil(averageUsers) : "N/A",
            total_duration: formatTime(totalUserTime)
        });
    }

    console.log('Finished generating voice activity report');
    return results;
}

// Function to generate a report for a specific channel
async function generateReportByChannel(serverId, channelId) {
    console.log(`Starting to generate report for channel ${channelId}`);

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

    console.log(`Finished generating report for channel ${channelId}`);
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
