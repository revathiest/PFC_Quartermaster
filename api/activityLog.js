const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
router.use(express.json());

const { UsageLog } = require('../config/database');
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

async function listCommands(req, res) {
  const client = getClient();
  const guild = client?.guilds?.cache.get(config.guildId);
  if (!client || !guild) {
    console.error('Discord client unavailable for commands endpoint');
    return res.status(500).json({ error: 'Discord client unavailable' });
  }
  const commands = Array.from(client.commands?.keys() || []).map(n => `/${n}`);
  res.json({ commands });
}

async function getCommand(req, res) {
  const { command } = req.params;
  const client = getClient();
  const guild = client?.guilds?.cache.get(config.guildId);
  if (!client || !guild) {
    console.error('Discord client unavailable for commands endpoint');
    return res.status(500).json({ error: 'Discord client unavailable' });
  }
  const cmd = client.commands?.get(command);
  if (!cmd) return res.status(404).json({ error: 'Not found' });
  res.json({
    command: {
      command: `/${cmd.data.name}`,
      description: cmd.data.description,
      aliases: cmd.aliases || [],
      cooldown: cmd.cooldown ? `${cmd.cooldown}s` : undefined
    }
  });
}

async function listMembers(req, res) {
  const client = getClient();
  const guild = client?.guilds?.cache.get(config.guildId);
  if (!client || !guild) {
    console.error('Discord client unavailable for members endpoint');
    return res.status(500).json({ error: 'Discord client unavailable' });
  }
  try {
    await guild.members.fetch();
    const members = guild.members.cache.map(m => ({
      userId: m.id,
      username: m.user.username
    }));
    res.json({ members });
  } catch (err) {
    console.error('Failed to fetch members:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getMember(req, res) {
  const { userId } = req.params;
  const client = getClient();
  const guild = client?.guilds?.cache.get(config.guildId);
  if (!client || !guild) {
    console.error('Discord client unavailable for members endpoint');
    return res.status(500).json({ error: 'Discord client unavailable' });
  }
  try {
    const member = await guild.members.fetch(userId);
    if (!member) return res.status(404).json({ error: 'Not found' });
    res.json({
      member: {
        userId: member.id,
        username: member.user.username,
        joinDate: member.joinedAt?.toISOString().split('T')[0],
        roles: member.roles.cache.map(r => r.name),
        isActive: member.presence ? member.presence.status !== 'offline' : false
      }
    });
  } catch (err) {
    console.error('Failed to fetch member:', err);
    res.status(404).json({ error: 'Not found' });
  }
}

router.get('/activity-log/search', searchLogs);
router.post('/activity-log/search', searchLogsPost);
router.get('/commands', listCommands);
router.get('/command/:command', getCommand);
router.get('/members', listMembers);
router.get('/member/:userId', getMember);

module.exports = {
  router,
  searchLogs,
  searchLogsPost,
  listCommands,
  getCommand,
  listMembers,
  getMember
};
