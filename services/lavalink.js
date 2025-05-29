const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
// Use builtin fetch when available, otherwise fall back to node-fetch
const fetchFn = global.fetch || require('node-fetch');
const debugLog = require('../utils/debugLogger');
let config = {};
try {
  config = require(path.join(__dirname, '..', 'config', 'lavalink.json'));
} catch {
  // ignore if config file missing; env vars may still be set
}

const host = process.env.LAVALINK_HOST || config.host;
const port = process.env.LAVALINK_PORT || config.port;
const password = process.env.LAVALINK_PASSWORD || config.password;
const apiPrefix = process.env.LAVALINK_API_PREFIX || '/v4';

let lavalinkProcess;

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function spawnLavalink() {
  if (lavalinkProcess) return lavalinkProcess;
  const lavalinkJar = path.join(__dirname, '..', 'lavalink', 'Lavalink.jar');
  if (!fs.existsSync(lavalinkJar)) {
    console.error(`❌ Lavalink jar not found at ${lavalinkJar}`);
    return undefined;
  }
  console.log('🧭 Starting local Lavalink...');
  lavalinkProcess = spawn('java', ['-Xmx512M', '-jar', lavalinkJar], {
    cwd: path.join(__dirname, '..', 'lavalink'),
    detached: true
  });

  lavalinkProcess.stdout.on('data', data => console.log(`[Lavalink]: ${data}`));
  lavalinkProcess.stderr.on('data', data => console.error(`[Lavalink Error]: ${data}`));
  lavalinkProcess.on('error', err =>
    console.error('❌ Lavalink process error:', err.message)
  );
  lavalinkProcess.on('close', code => {
    if (code !== 0) console.error(`⚠️ Lavalink exited with code ${code}`);
  });
  process.on('exit', () => lavalinkProcess.kill());
  return lavalinkProcess;
}

async function waitForLavalink(retries = 15, delayMs = 2000) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    const url = buildUrl('/version', true);
    try {
      const res = await fetchFn(url, {
        headers: { Authorization: password }
      });
      if (res.ok) {
        console.log('🚀 Lavalink ready.');
        return;
      }
      lastError = new Error(`HTTP ${res.status}`);
      console.error(`⚠️ Lavalink connection attempt to ${url} failed with status ${res.status}`);
    } catch (err) {
      lastError = err;
      console.error(`⚠️ Lavalink connection attempt to ${url} failed:`, err.stack || err.message);
    }
    await delay(delayMs);
  }
  console.error('❌ Lavalink failed to start or is unreachable.');
  if (lastError) console.error('⚠️ Last error:', lastError.stack || lastError.message);
  throw new Error('Lavalink not reachable');
}

if (process.env.SPAWN_LOCAL_LAVALINK === 'true') {
  spawnLavalink();
  // Fire and forget to avoid blocking startup
  waitForLavalink().catch(() => {});
}

function buildUrl(path, noPrefix = false) {
  return `http://${host}:${port}${noPrefix ? '' : apiPrefix}${path}`;
}

async function loadTrack(query) {
  let res;
  const url = buildUrl(`/loadtracks?identifier=${encodeURIComponent(query)}`);
  debugLog('Loading track via Lavalink:', url);
  try {
    res = await fetchFn(url, {
      headers: { Authorization: password }
    });
  } catch (err) {
    console.error(`❌ Lavalink connection failed (${url}):`, err.stack || err.message);
    throw new Error('Lavalink connection failed');
  }
  if (!res.ok) {
    console.error(`⚠️ Lavalink responded with status ${res.status} for ${url}`);
    throw new Error('Failed to load track');
  }
  debugLog('Lavalink loadTrack status:', res.status);
  const data = await res.json();
  if (data.loadType === 'LOAD_FAILED' || data.loadType === 'NO_MATCHES') {
    console.error('⚠️ Lavalink returned loadType', data.loadType);
    throw new Error('Failed to load track');
  }
  return data;
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
