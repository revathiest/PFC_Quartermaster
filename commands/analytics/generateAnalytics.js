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
        attributes: ['channel_id', 'user_id', 'timestamp', [sequelize.literal("'join'"), 'eventType']],
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
        attributes: ['channel_id', 'user_id', 'timestamp', [sequelize.literal("'leave'"), 'eventType']],
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

    // Combine and sort events by timestamp
    const events = [...joins, ...leaves].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    console.log(`Total events after combining and sorting: ${events.length}`);

    const currentTime = new Date();
    const channelData = {};

    // Process each event
    for (const event of events) {
        console.log(`Processing ${event.eventType} event: user ${event.user_id} ${event.eventType} channel ${event.channel_id} at ${event.timestamp}`);
        if (!channelData[event.channel_id]) {
            channelData[event.channel_id] = { users: new Set(), peakUsers: 0, totalUserTime: 0, lastTimestamp: new Date(event.timestamp) };
            console.log(`Initialized data for channel ${event.channel_id}`);
        }
        const channel = channelData[event.channel_id];

        if (channel.users.size > 0) {
            const duration = (new Date(event.timestamp) - channel.lastTimestamp) / 1000;
            if (duration < 0) {
                console.error(`Negative duration detected: event timestamp ${event.timestamp}, lastTimestamp ${channel.lastTimestamp}`);
            } else {
                channel.totalUserTime += duration * channel.users.size;
                console.log(`${event.eventType} event: channel ${event.channel_id}, duration ${duration}s, users ${channel.users.size}, totalUserTime ${channel.totalUserTime}s`);
            }
        }

        channel.lastTimestamp = new Date(event.timestamp);

        if (event.eventType === 'join') {
            channel.users.add(event.user_id);
            console.log(`User ${event.user_id} joined channel ${event.channel_id}, users now: ${channel.users.size}`);
            channel.peakUsers = Math.max(channel.peakUsers, channel.users.size);
            console.log(`Updated peak users for channel ${event.channel_id} to ${channel.peakUsers}`);
        } else if (event.eventType === 'leave') {
            if (channel.users.has(event.user_id)) {
                channel.users.delete(event.user_id);
                console.log(`User ${event.user_id} left channel ${event.channel_id}, users now: ${channel.users.size}`);
            } else {
                console.error(`User ${event.user_id} leave event without a corresponding join event in channel ${event.channel_id}`);
            }
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
