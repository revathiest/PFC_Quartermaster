const host = process.env.LAVALINK_HOST;
const port = process.env.LAVALINK_PORT;
const password = process.env.LAVALINK_PASSWORD;

function buildUrl(path) {
  return `http://${host}:${port}${path}`;
}

async function loadTrack(query) {
  const res = await fetch(buildUrl(`/loadtracks?identifier=${encodeURIComponent(query)}`), {
    headers: { Authorization: password }
  });
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
