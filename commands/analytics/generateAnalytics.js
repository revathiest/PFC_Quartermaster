const { sequelize, UsageLog, VoiceLog } = require('../../config/database');

async function generateUsageReport() {
    const results = await UsageLog.findAll({
        attributes: [
            'user_id',
            'interaction_type',
            'event_type',
            'server_id',
            [sequelize.fn('COUNT', sequelize.col('event_type')), 'event_count']
        ],
        group: ['user_id', 'interaction_type', 'event_type', 'server_id'],
        order: [[sequelize.fn('COUNT', sequelize.col('event_type')), 'DESC']],
    });
    return results.map(result => result.get());
}

async function generateVoiceActivityReport() {
    const results = await VoiceLog.findAll({
        attributes: [
            'user_id',
            'server_id',
            [sequelize.fn('SUM', sequelize.fn('COALESCE', sequelize.col('duration'), 0)), 'total_duration']
        ],
        where: { event_type: 'voice_leave' },
        group: ['user_id', 'server_id'],
        order: [[sequelize.fn('SUM', sequelize.fn('COALESCE', sequelize.col('duration'), 0)), 'DESC']],
    });
    return results.map(result => result.get());
}

async function generateReportByChannel() {
    const results = await UsageLog.findAll({
        attributes: [
            'channel_id',
            [sequelize.fn('COUNT', sequelize.col('event_type')), 'event_count']
        ],
        group: ['channel_id'],
        order: [[sequelize.fn('COUNT', sequelize.col('event_type')), 'DESC']],
    });
    return results.map(result => result.get());
}

async function generateReportByRole() {
    const results = await sequelize.query(`
        SELECT role_id, COUNT(*) as event_count
        FROM user_roles 
        JOIN usage_logs ON user_roles.user_id = usage_logs.user_id
        GROUP BY role_id
        ORDER BY event_count DESC
    `);
    return results[0];
}

module.exports = {
    generateUsageReport,
    generateVoiceActivityReport,
    generateReportByChannel,
    generateReportByRole
};
