# Changelog

## Unreleased
### Added
- Initial music bot framework with Lavalink integration.
- `/play` and `/queue` commands with basic queue management.
- Graceful error handling when Lavalink is unreachable.
- Lavalink service now falls back to `node-fetch` when `fetch` is not available.
- Optional local Lavalink spawning with `SPAWN_LOCAL_LAVALINK` env var.
- Startup now verifies Lavalink becomes reachable and logs readiness.
- Fallback YouTube search for text queries in `/play`.
- Spotify service now refreshes tokens on 401 responses.
