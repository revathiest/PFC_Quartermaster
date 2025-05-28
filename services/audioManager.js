const lavalink = require('./lavalink');
const spotify = require('./spotify');
const youtube = require('./youtube');

const queues = new Map();

function _clear() {
  queues.clear();
}

function getQueue(guildId) {
  return queues.get(guildId) || [];
}

async function enqueue(guildId, query) {
  const queue = queues.get(guildId) || [];
  const targets = await resolveQuery(query);
  for (const target of targets) {
    let data;
    try {
      data = await lavalink.loadTrack(target);
    } catch (err) {
      console.error('❌ Failed to load track:', err.message);
      throw new Error('Failed to load track');
    }
    const track = data.tracks ? data.tracks[0] : data;
    queue.push(track);
    if (queue.length === 1) {
      await lavalink.play(guildId, track.track || track.encoded);
    }
  }
  queues.set(guildId, queue);
}

function isUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

async function resolveQuery(query) {
  if (query.includes('open.spotify.com/')) {
    try {
      if (query.includes('/playlist/')) {
        const id = query.match(/playlist\/([^/?]+)/)[1];
        const data = await spotify.getPlaylistTracks(id);
        const tracks = [];
        for (const item of data.items) {
          const t = item.track;
          const name = `${t.name} ${t.artists[0]?.name || ''}`.trim();
          tracks.push(await youtube.search(name));
        }
        return tracks;
      }
      if (query.includes('/track/')) {
        const id = query.match(/track\/([^/?]+)/)[1];
        const t = await spotify.getTrack(id);
        const name = `${t.name} ${t.artists[0]?.name || ''}`.trim();
        return [await youtube.search(name)];
      }
    } catch (err) {
      console.error('❌ Failed to process Spotify query:', err.message);
      throw new Error('Failed to load track');
    }
  }
  if (!isUrl(query)) {
    try {
      return [await youtube.search(query)];
    } catch (err) {
      console.error('❌ Failed to search YouTube:', err.message);
      throw new Error('Failed to load track');
    }
  }
  return [query];
}

async function skip(guildId) {
  const queue = queues.get(guildId) || [];
  queue.shift();
  if (queue[0]) {
    await lavalink.play(guildId, queue[0].track || queue[0].encoded);
  } else {
    await lavalink.stop(guildId);
  }
  queues.set(guildId, queue);
}

module.exports = { enqueue, getQueue, skip, _clear };
