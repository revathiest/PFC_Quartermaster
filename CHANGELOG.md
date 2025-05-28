# Changelog

## Unreleased
### Added
- Initial music bot framework with Lavalink integration.
- `/play` and `/queue` commands with basic queue management.
- Graceful error handling when Lavalink is unreachable.
- Lavalink service now falls back to `node-fetch` when `fetch` is not available.
- Optional local Lavalink spawning with `SPAWN_LOCAL_LAVALINK` env var.
