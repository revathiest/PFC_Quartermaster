const { sequelize, usageLog, voiceLog } = require('../../config/database');

async function generateUsageReport() {
    const results = await usageLog.findAll({
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
    const results = await voiceLog.findAll({
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
    const results = await usageLog.findAll({
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
    // Assuming you have a way to get user roles, this is a placeholder query
    const results = await sequelize.query(`
        SELECT role_id, COUNT(*) as event_count
        FROM user_roles 
        JOIN usage_logs ON user_roles.user_id = usage_logs.user_id
        GROUP BY role_id
        ORDER BY event_count DESC
    `);
    return results[0];
}

async function main() {
    const usageReport = await generateUsageReport();
    console.log('Usage Report:');
    usageReport.forEach(row => {
        console.log(`User ID: ${row.user_id}, Event: ${row.event_type}, Count: ${row.event_count}`);
    });

    const voiceReport = await generateVoiceActivityReport();
    console.log('Voice Activity Report:');
    voiceReport.forEach(row => {
        console.log(`User ID: ${row.user_id}, Total Duration in Voice (seconds): ${row.total_duration}`);
    });

    const channelReport = await generateReportByChannel();
    console.log('Channel Activity Report:');
    channelReport.forEach(row => {
        console.log(`Channel ID: ${row.channel_id}, Event Count: ${row.event_count}`);
    });

    const roleReport = await generateReportByRole();
    console.log('Role Activity Report:');
    roleReport.forEach(row => {
        console.log(`Role ID: ${row.role_id}, Event Count: ${row.event_count}`);
    });
}

main().catch(err => {
    console.error('Error generating reports:', err);
});
