# 🎧 Discord Music Bot Blueprint (Free & Robust)

This document outlines a complete implementation plan for a free, high-quality Discord music bot that integrates Spotify for metadata and plays music via YouTube. This plan avoids legal grey zones as much as possible, and is designed for robustness and scalability.

---

## 🧱 Architecture Overview

**Technologies Used:**

* `discord.js v14`: Discord bot framework
* `@discordjs/voice`: Voice channel support
* `Lavalink`: Audio processing and playback backend
* `Spotify Web API`: Metadata only (playlists, track info)
* `yt-dlp`: Extracts audio from YouTube and other platforms

---

## 🗂️ File Structure & Responsibilities

### `commands/music/play.ts`

* Slash command handler for `/play`
* Parses user input (Spotify URL, YouTube URL, or search query)
* Delegates track resolution and queueing to `audioManager`

### `commands/music/queue.ts`

* Slash command handler for `/queue`
* Displays current and upcoming tracks in the queue

### `services/lavalink.ts`

* Establishes and manages connection to Lavalink server
* Exposes API to:

  * Load tracks
  * Start, pause, skip, and stop playback
  * Monitor player state

### `services/spotify.ts`

* Handles Spotify Web API authentication (client credentials grant)
* Functions:

  * `searchTrack(query: string): SpotifyTrack`
  * `getPlaylistTracks(playlistId): SpotifyTrack[]`

### `services/youtube.ts`

* Uses yt-dlp or YouTube search API to find a playable URL for a given query
* Matches Spotify metadata to a YouTube video
* Returns direct streamable URL or Lavalink-compatible ID

### `services/audioManager.ts`

* Central orchestration for:

  * Connecting to voice
  * Managing playback and queue per guild
  * Interfacing with Lavalink
* Handles retry logic, cleanup, timeouts

### `utils/cache.ts`

* Optional caching layer to store mappings:

  * Spotify Track ID → YouTube URL
* Reduces API calls and speeds up repeated requests

### `config/lavalink.json`

* Lavalink server configuration (host, port, password, etc.)

---

## 🔌 External Dependencies

* **Lavalink Server:**

  * Java-based audio node
  * Deployed on local server or free VPS

* **yt-dlp:**

  * CLI tool to extract direct audio stream URLs

* **Spotify Developer Account:**

  * Needed for client ID/secret and metadata access

---

## 🛠️ Core Implementation Steps

### 1. **Deploy Lavalink**

* Host Lavalink with ports open for REST and WebSocket
* Secure with password

### 2. **Lavalink Client in Bot**

* Use `erela.js` or custom wrapper
* Maintain persistent connection with auto-reconnect

### 3. **Spotify Metadata Integration**

* Authenticate using client credentials
* Fetch tracks and playlist content

### 4. **YouTube Track Matching**

* Use track name + artist to find corresponding YouTube video
* Can use search APIs or yt-dlp directly

### 5. **Voice Channel Playback**

* Use `@discordjs/voice` to join channel
* Stream from Lavalink node
* Handle disconnects and idle timeouts

### 6. **Queue Management**

* Track state per guild (in-memory or with Sequelize)
* Commands: `add`, `skip`, `pause`, `resume`, `show`

### 7. **Slash Command Setup**

* Register commands for:

  * `/play [query/url]`
  * `/skip`
  * `/pause`
  * `/resume`
  * `/queue`
  * `/leave`

---

## 🧠 Optional Enhancements

* **Spotify-YouTube Mapping Cache**
* **Audio Filters via Lavalink**
* **Multi-node Lavalink Support**
* **Rate Limiting/User Cooldowns**

---

## 🧪 Testing Strategy

* Use Jest to mock:

  * Spotify API
  * Lavalink REST
  * YouTube search
  * Voice state transitions
* Focus on testing:

  * Queue logic
  * Command resolution
  * API fallback behaviour

---

## 🔐 Environment Variables

```env
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
LAVALINK_HOST=...
LAVALINK_PORT=...
LAVALINK_PASSWORD=...
YTDLP_PATH=/usr/bin/yt-dlp
```
