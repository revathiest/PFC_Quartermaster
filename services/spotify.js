let token = null;

async function auth() {
  if (token) return token;
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
  return token;
}

async function searchTrack(query) {
  const tk = await auth();
  const res = await fetch(`https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${tk}` }
  });
  if (!res.ok) throw new Error('Spotify search failed');
  return res.json();
}

async function getPlaylistTracks(id) {
  const tk = await auth();
  const res = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
    headers: { Authorization: `Bearer ${tk}` }
  });
  if (!res.ok) throw new Error('Spotify playlist fetch failed');
  return res.json();
}

async function getTrack(id) {
  const tk = await auth();
  const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
    headers: { Authorization: `Bearer ${tk}` }
  });
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
