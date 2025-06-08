const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
router.use(express.json());

const { sequelize, UsageLog } = require('../config/database');
const { getClient } = require('../discordClient');
const config = require('../config.json');

function buildFilters({ type, userId, command, message }) {
  const where = { server_id: config.guildId };
  if (type) where.event_type = type;
  if (userId) where.user_id = userId;
  if (command) where.command_name = command;
  if (message) where.message_content = { [Op.like]: `%${message}%` };
  return where;
}

async function executeSearch(opts, res) {
  const page = parseInt(opts.page, 10) || 1;
  const limit = parseInt(opts.limit, 10) || 25;
  const where = buildFilters(opts);
  try {
    const logs = await UsageLog.findAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['timestamp', 'DESC']]
    });
    res.json({ logs });
  } catch (err) {
    console.error('Failed to search logs:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function searchLogs(req, res) {
  await executeSearch(req.query || {}, res);
}

async function searchLogsPost(req, res) {
  const { page, limit, filters = {} } = req.body || {};
  await executeSearch({ page, limit, ...filters }, res);
}

async function listEventTypes(req, res) {
  try {
    const records = await UsageLog.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('event_type')), 'event_type']
      ],
      where: { server_id: config.guildId }
    });
    const eventTypes = records.map(r => r.get ? r.get('event_type') : r.event_type);
    res.json({ eventTypes });
  } catch (err) {
    console.error('Failed to load event types:', err);
    res.status(500).json({ error: 'Server error' });
  }
}


router.get('/search', searchLogs);
router.post('/search', searchLogsPost);
router.get('/event-types', listEventTypes);

module.exports = {
  router,
  searchLogs,
  searchLogsPost,
  listEventTypes
};
