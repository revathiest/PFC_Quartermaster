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

async function listSections(req, res) {
  try {
    const records = await SiteContent.findAll({ attributes: ['section'] });
    const sections = records.map(r => r.section);
    res.json({ sections });
  } catch (err) {
    console.error('Failed to load sections:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.get('/', listSections);
router.get('/:section', getContent);

module.exports = { router, getContent, listSections };
