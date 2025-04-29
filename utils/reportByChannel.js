const { sequelize, UsageLog } = require('../config/database');
const { Op } = require('sequelize');

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
    generateReportByChannel
}