const { sequelize, UsageLog, VoiceLog } = require('../../config/database');

async function generateUsageReport() {
    const results = await UsageLog.findAll({
        attributes: [
            'user_id',
            'event_type',
            [sequelize.fn('COUNT', sequelize.col('event_type')), 'event_count']
        ],
        group: ['user_id', 'event_type'],
        order: [[sequelize.fn('COUNT', sequelize.col('event_type')), 'DESC']],
    });
    return results.map(result => result.get());
}

async function generateVoiceActivityReport() {
    const results = await VoiceLog.findAll({
        attributes: [
            'user_id',
            [sequelize.fn('SUM', sequelize.fn('JSON_UNQUOTE', sequelize.fn('JSON_EXTRACT', sequelize.col('event_data'), '$.duration'))), 'total_duration']
        ],
        where: { event_type: 'voice_join' },
        group: ['user_id'],
        order: [[sequelize.fn('SUM', sequelize.fn('JSON_UNQUOTE', sequelize.fn('JSON_EXTRACT', sequelize.col('event_data'), '$.duration'))), 'DESC']],
    });
    return results.map(result => result.get());
}

async function generateReportByChannel() {
    const results = await UsageLog.findAll({
        attributes: [
            [sequelize.fn('JSON_UNQUOTE', sequelize.fn('JSON_EXTRACT', sequelize.col('event_data'), '$.channel_id')), 'channel_id'],
            [sequelize.fn('COUNT', sequelize.col('event_type')), 'event_count']
        ],
        group: [[sequelize.fn('JSON_UNQUOTE', sequelize.fn('JSON_EXTRACT', sequelize.col('event_data'), '$.channel_id'))]],
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
