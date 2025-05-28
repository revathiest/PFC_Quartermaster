const debugLog = require('../utils/debugLogger');

let token = null;

async function auth() {
  if (token) return token;
  debugLog('Requesting Spotify token');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET
    })
  });
  const data = await res.json();
  token = data.access_token;
  debugLog('Received Spotify token');
  return token;
}

async function fetchSpotify(url) {
  debugLog('Fetching Spotify URL:', url);
  let tk = await auth();
  let res = await fetch(url, { headers: { Authorization: `Bearer ${tk}` } });
  if (!res.ok && res.status === 401) {
    token = null;
    tk = await auth();
    res = await fetch(url, { headers: { Authorization: `Bearer ${tk}` } });
  }
  debugLog('Spotify response status:', res.status);
  return res;
}

async function searchTrack(query) {
  debugLog('Searching Spotify for track:', query);
  const res = await fetchSpotify(`https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Spotify search failed');
  return res.json();
}

async function getPlaylistTracks(id) {
  debugLog('Fetching Spotify playlist tracks for:', id);
  const res = await fetchSpotify(`https://api.spotify.com/v1/playlists/${id}/tracks`);
  if (!res.ok) throw new Error('Spotify playlist fetch failed');
  return res.json();
}

async function getTrack(id) {
  debugLog('Fetching Spotify track for:', id);
  const res = await fetchSpotify(`https://api.spotify.com/v1/tracks/${id}`);
  if (!res.ok) throw new Error('Spotify track fetch failed');
  return res.json();
}

module.exports = {
  searchTrack,
  getPlaylistTracks,
  getTrack,
  _resetAuth: () => {
    token = null;
  }
};
