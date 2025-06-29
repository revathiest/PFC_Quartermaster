const express = require('express');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const { getClient } = require('../discordClient');
const config = require('../config.json');

const router = express.Router();
router.use(express.json());

async function discordLogin(req, res) {
  const { code, redirectUri } = req.body || {};
  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'Missing code or redirectUri' });
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  if (!clientId || !clientSecret || !jwtSecret) {
    console.error('Discord OAuth not configured');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenRes.ok) {
      console.error('Failed to exchange code:', tokenRes.status);
      return res.status(403).json({ error: 'Invalid code' });
    }

    const tokenData = await tokenRes.json();
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!userRes.ok) {
      console.error('Failed to fetch user:', userRes.status);
      return res.status(500).json({ error: 'Discord fetch error' });
    }

    const user = await userRes.json();

    const client = getClient();
    const guild = client?.guilds?.cache.get(config.guildId);
    if (!client || !guild) {
      console.error('Discord client unavailable for login endpoint');
      return res.status(500).json({ error: 'Discord client unavailable' });
    }

    let member;
    try {
      member = await guild.members.fetch(user.id);
    } catch (err) {
      console.error('Failed to fetch member:', err);
      return res.status(500).json({ error: 'Discord fetch error' });
    }

    const displayName = member.displayName;
    const roles = member.roles.cache.map(r => r.name);
    const payload = {
      id: user.id,
      username: user.username,
      displayName,
      roles
    };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '30m' });
    res.json({ token });
  } catch (err) {
    console.error('Discord login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.post('/', discordLogin);

module.exports = { router, discordLogin };
