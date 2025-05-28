# Multi-Server Support Plan

This document outlines the work required to make the bot operate across multiple Discord servers.

## 1. Configuration Refactor
- **Current**: `config.json` stores a single `guildId` and other values.
- **Needed**:
  - Introduce a database table or JSON store for per-guild settings (channel IDs, role mappings, org tag, etc.).
  - Remove the hard-coded `guildId` from command registration and use global commands or register per guild dynamically when the bot joins a server.
  - Update `configLoader` and related utilities to read settings per guild.

## 2. Command Registration
- **Current**: `utils/commandRegistration.js` registers commands using `Routes.applicationGuildCommands(clientId, guildId)` which limits them to one server【F:utils/commandRegistration.js†L9-L33】.
- **Needed**:
  - Use global registration (`Routes.applicationCommands`) or iterate over guilds and register commands for each guild upon joining.
  - Ensure commands are registered when the bot is invited to a new server.

## 3. Server‑Specific Strings
- **Current**: Many files contain hard‑coded references to "Pyro Freelancer Corps" and the `PFCS` org ID, e.g. in `updaterules.js`【F:botactions/updaterules.js†L42-L66】, scheduled announcements【F:botactions/scheduling/scheduledAnnouncementEngine.js†L31-L37】 and verification logic【F:commands/user/verify.js†L96-L114】.
- **Needed**:
  - Replace these with values loaded from per‑guild configuration.
  - Allow each guild to define its own default author text, footer, and org ID if used.

## 4. Channel and Role Mapping
- **Current**: `channelRegistry.js` expects specific channel names like `pfc-bot-activity-log` and assigns them to properties on the client object【F:botactions/channelManagement/channelRegistry.js†L3-L27】.
- **Needed**:
  - Store channel mappings per guild in configuration.
  - Update code to read mappings dynamically and fall back gracefully if a channel is missing.

## 5. Org‑Specific Logic
- **Current**: Verification and role assignment assume the target organization is `PFCS`【F:commands/user/verify.js†L96-L114】【F:commands/admin/manual-verify.js†L27-L60】.
- **Needed**:
  - Parameterize the target organization ID and roles so any server can define their own verification rules.
  - Update tests that assert `PFCS` to use configurable values.

## 6. Database Schema Updates
- **Potential Work**:
  - Add tables for guild settings (server ID, org ID, channel IDs, roles).
  - Migrate existing data accordingly and update Sequelize models.

## 7. Invite & Onboarding Flow
- Implement logic for the bot to handle the `guildCreate` event:
  - Initialize default settings for the new guild.
  - Register slash commands for that guild if using guild‑specific commands.

## 8. Documentation and Tests
- Update README with instructions for multi‑server configuration.
- Extend unit tests to cover per‑guild configuration paths.

By addressing these areas, the bot will be able to function fully when invited to any server, instead of being restricted to a single guild.
