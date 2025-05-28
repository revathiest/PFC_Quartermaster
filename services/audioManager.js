const lavalink = require('./lavalink');

const queues = new Map();

function _clear() {
  queues.clear();
}

function getQueue(guildId) {
  return queues.get(guildId) || [];
}

async function enqueue(guildId, query) {
  let data;
  try {
    data = await lavalink.loadTrack(query);
  } catch (err) {
    console.error('❌ Failed to load track:', err.message);
    throw new Error('Failed to load track');
  }
  const track = data.tracks ? data.tracks[0] : data;
  const queue = queues.get(guildId) || [];
  queue.push(track);
  queues.set(guildId, queue);
  if (queue.length === 1) {
    await lavalink.play(guildId, track.track || track.encoded);
  }
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
