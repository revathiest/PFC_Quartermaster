const express = require('express');
const router = express.Router();
const { Event } = require('../config/database');

async function listEvents(req, res) {
  try {
    const events = await Event.findAll();
    res.json({ events });
  } catch (err) {
    console.error('Failed to load events:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.get('/', listEvents);

module.exports = { router, listEvents };
