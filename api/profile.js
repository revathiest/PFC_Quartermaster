const express = require('express');
const router = express.Router();
const { VerifiedUser } = require('../config/database');
const { fetchRsiProfileInfo } = require('../utils/rsiProfileScraper');

async function getProfile(req, res) {
  const { userId } = req.params;
  try {
    const verified = await VerifiedUser.findByPk(userId);
    if (!verified) return res.status(404).json({ error: 'Not found' });
    const profile = await fetchRsiProfileInfo(verified.rsiHandle);
    res.json({ profile });
  } catch (err) {
    console.error('Failed to fetch member profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.get('/:userId', getProfile);

module.exports = { router, getProfile };
