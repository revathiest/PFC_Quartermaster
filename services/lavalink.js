const path = require('path');
const { spawn } = require('child_process');
// Use builtin fetch when available, otherwise fall back to node-fetch
const fetchFn = global.fetch || require('node-fetch');
let config = {};
try {
  config = require(path.join(__dirname, '..', 'config', 'lavalink.json'));
} catch {
  // ignore if config file missing; env vars may still be set
}

const host = process.env.LAVALINK_HOST || config.host;
const port = process.env.LAVALINK_PORT || config.port;
const password = process.env.LAVALINK_PASSWORD || config.password;

let lavalinkProcess;

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function spawnLavalink() {
  if (lavalinkProcess) return lavalinkProcess;
  console.log('🧭 Starting local Lavalink...');
  const lavalinkJar = path.join(__dirname, '..', 'lavalink', 'Lavalink.jar');
  lavalinkProcess = spawn('java', ['-Xmx512M', '-jar', lavalinkJar], {
    cwd: path.join(__dirname, '..', 'lavalink'),
    detached: true
  });

  lavalinkProcess.stdout.on('data', data => console.log(`[Lavalink]: ${data}`));
  lavalinkProcess.stderr.on('data', data => console.error(`[Lavalink Error]: ${data}`));
  process.on('exit', () => lavalinkProcess.kill());
  return lavalinkProcess;
}

async function waitForLavalink(retries = 5, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetchFn(buildUrl('/version'), {
        headers: { Authorization: password }
      });
      if (res.ok) {
        console.log('🚀 Lavalink ready.');
        return;
      }
    } catch {
      // ignore and retry
    }
    await delay(delayMs);
  }
  console.error('❌ Lavalink failed to start or is unreachable.');
  throw new Error('Lavalink not reachable');
}

if (process.env.SPAWN_LOCAL_LAVALINK === 'true') {
  spawnLavalink();
  // Fire and forget to avoid blocking startup
  waitForLavalink().catch(() => {});
}

function buildUrl(path) {
  return `http://${host}:${port}${path}`;
}

async function loadTrack(query) {
  let res;
  try {
    res = await fetchFn(buildUrl(`/loadtracks?identifier=${encodeURIComponent(query)}`), {
      headers: { Authorization: password }
    });
  } catch (err) {
    throw new Error('Lavalink connection failed');
  }
  if (!res.ok) throw new Error('Failed to load track');
  return res.json();
}

async function play(guildId, track) {
  return fetchFn(buildUrl(`/sessions/${guildId}/players/${guildId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: password },
    body: JSON.stringify({ encodedTrack: track })
  });
}

async function stop(guildId) {
  return fetchFn(buildUrl(`/sessions/${guildId}/players/${guildId}`), {
    method: 'DELETE',
    headers: { Authorization: password }
  });
}

module.exports = { loadTrack, play, stop, spawnLavalink, waitForLavalink };
