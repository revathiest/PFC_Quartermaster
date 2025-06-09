const express = require('express');
const router = express.Router();
const { VerifiedUser } = require('../config/database');
const { fetchRsiProfileInfo } = require('../utils/rsiProfileScraper');
const { fetchDiscordProfileInfo } = require('../utils/discordProfile');

async function getProfile(req, res) {
  const { userId } = req.params;
  try {
    const verified = await VerifiedUser.findByPk(userId);
    if (!verified) return res.status(404).json({ error: 'Not found' });

    const [rsiProfile, discordProfile] = await Promise.all([
      fetchRsiProfileInfo(verified.rsiHandle),
      fetchDiscordProfileInfo(userId)
    ]);

    res.json({ rsiProfile, discordProfile });
  } catch (err) {
    console.error('Failed to fetch member profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.get('/:userId', getProfile);

module.exports = { router, getProfile };
