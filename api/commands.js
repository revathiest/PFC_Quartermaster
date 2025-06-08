const express = require('express');
const router = express.Router();
const { getClient } = require('../discordClient');
const config = require('../config.json');

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

router.get('/commands', listCommands);
router.get('/command/:command', getCommand);

module.exports = { router, listCommands, getCommand };
