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

async function getEvent(req, res) {
  const { id } = req.params;
  try {
    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ error: 'Not found' });
    res.json({ event });
  } catch (err) {
    console.error('Failed to load event:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.get('/', listEvents);
router.get('/:id', getEvent);

module.exports = { router, listEvents, getEvent };
