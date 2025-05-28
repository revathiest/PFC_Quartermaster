const path = require('path');
let config = {};
try {
  config = require(path.join(__dirname, '..', 'config', 'lavalink.json'));
} catch {
  // ignore if config file missing; env vars may still be set
}

const host = process.env.LAVALINK_HOST || config.host;
const port = process.env.LAVALINK_PORT || config.port;
const password = process.env.LAVALINK_PASSWORD || config.password;

function buildUrl(path) {
  return `http://${host}:${port}${path}`;
}

async function loadTrack(query) {
  let res;
  try {
    res = await fetch(buildUrl(`/loadtracks?identifier=${encodeURIComponent(query)}`), {
      headers: { Authorization: password }
    });
  } catch (err) {
    throw new Error('Lavalink connection failed');
  }
  if (!res.ok) throw new Error('Failed to load track');
  return res.json();
}

async function play(guildId, track) {
  return fetch(buildUrl(`/sessions/${guildId}/players/${guildId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: password },
    body: JSON.stringify({ encodedTrack: track })
  });
}

async function stop(guildId) {
  return fetch(buildUrl(`/sessions/${guildId}/players/${guildId}`), {
    method: 'DELETE',
    headers: { Authorization: password }
  });
}

module.exports = { loadTrack, play, stop };
