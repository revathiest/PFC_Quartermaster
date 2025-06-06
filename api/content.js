const express = require('express');
const router = express.Router();
const { SiteContent } = require('../config/database');

async function getContent(req, res) {
  const { section } = req.params;
  try {
    const record = await SiteContent.findOne({ where: { section } });
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json({ content: record.content });
  } catch (err) {
    console.error('Failed to load content:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.get('/:section', getContent);

module.exports = { router, getContent };
