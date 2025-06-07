const express = require('express');
const router = express.Router();
const { verify, sign } = require('../utils/jwt');

router.use(express.json());

function exchangeToken(req, res) {
  const signingSecret = process.env.JWT_SIGNING_SECRET;
  const secret = process.env.JWT_SECRET;
  if (!signingSecret || !secret) {
    console.error('JWT secrets not configured');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  const payload = verify(token, signingSecret);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  const apiToken = sign(payload, secret);
  res.json({ token: apiToken });
}

router.post('/', exchangeToken);

module.exports = { router, exchangeToken };
