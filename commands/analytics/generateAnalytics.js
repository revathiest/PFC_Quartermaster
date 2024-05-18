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
    const results = await VoiceLog.findAll({
        attributes: [
            'channel_id',
            [sequelize.fn('MAX', sequelize.col('user_id')), 'peak_users'],
            [sequelize.fn('SUM', sequelize.fn('COALESCE', sequelize.col('duration'), 0)), 'total_duration']
        ],
        where: {
            server_id: serverId,
            event_type: 'voice_leave',
            timestamp: {
                [Op.gte]: sequelize.literal("NOW() - INTERVAL 7 DAY")
            }
        },
        group: ['channel_id'],
        order: [[sequelize.fn('SUM', sequelize.fn('COALESCE', sequelize.col('duration'), 0)), 'DESC']],
    });
    return results.map(result => result.get());
}

async function generateReportByChannel(serverId) {
    const results = await UsageLog.findAll({
        attributes: [
            'channel_id',
            'event_type',
            [sequelize.fn('COUNT', sequelize.col('event_type')), 'event_count']
        ],
        where: {
            server_id: serverId,
            timestamp: {
                [Op.gte]: sequelize.literal("NOW() - INTERVAL 7 DAY")
            }
        },
        group: ['channel_id', 'event_type'],
        order: [[sequelize.fn('COUNT', sequelize.col('event_type')), 'DESC']],
    });
    return results.map(result => result.get());
}

module.exports = {
    generateUsageReport,
    generateVoiceActivityReport,
    generateReportByChannel
};
