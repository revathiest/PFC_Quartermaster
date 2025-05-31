### LOGGING\_TODO.md

**Audit & Logging Improvements for Quartermaster Bot**

---

#### ✅ Existing Coverage

* `messageCreate` logging to DB via `UsageLog.create`
* AI prompt handling + OpenAI completions tracked
* Role-based and regex-based action detection
* Reaction adds/removals logged in `botactions/eventHandling/reactionEvents.js`
* Voice join/leave events via `voiceStateUpdate` in `botactions/eventHandling/voiceEvents.js`
* Interaction logging handled in `botactions/eventHandling/interactionEvents/logInteraction.js`
* Logs are streamed to Discord via `sendToDiscordLogChannel` and `jobs/flushLogs.js`

---

#### 🆕 Logging Requirements

##### 🗑️ Message Deletion

* Track all message deletions (not just bot-triggered).
* Store: user ID, message ID, content, channel ID, server ID, and timestamp.

##### ✍️ Message Edits

* Log any message edits.
* Store: old and new content, user ID, message ID, channel ID, server ID, and timestamp.

##### ➕ Other Event Types (Future Consideration)

* Member changes:

  * `guildMemberRemove` (for leaves or kicks)
  * `guildBanAdd` / `guildBanRemove`
* Channel changes:

  * `channelCreate`
  * `channelDelete`
  * `channelUpdate`
* Voice activity:

* Moderation context:

  * Attempt to include executor from audit logs (requires permissions).

##### 📢 Optional Enhancements

* Send logs to a mod-only Discord channel.
* Add log viewer slash command or web dashboard interface.
* Include bot-generated system messages if relevant.
* Provide config to toggle on/off each type of event logging.
