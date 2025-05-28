# Logging Emoji Guidelines

This project uses emojis in log messages to make console output easy to scan. Use the following standard set:

| Emoji | Purpose |
|-------|---------|
| ✅ | Successful completion |
| ⚠️ | Warning or recoverable issue |
| ❌ | Error or failure |
| 🚫 | Blocked or disallowed action |
| 🔁 | Repeated or scheduled action |
| 🧹 | Cleanup tasks |
| ⏰ | Scheduling or date-based info |
| 🛠️ | Setup or configuration step |
| 🧭 | Engine or scheduled job startup |
| 🚀 | Engine fully ready |
| 📅 | Date threshold or calendar action |

Always use the emoji presentation variant (with the trailing `\uFE0F` if applicable) to keep logs consistent across platforms.
