const { sequelize, UsageLog } = require('../config/database');
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

module.exports = {
    generateUsageReport
}