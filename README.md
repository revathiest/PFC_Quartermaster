
# Pyro Freelancers Corps (PFC) Quartermaster Bot

A powerful Discord bot built for the **Pyro Freelancers Corps**, designed to manage trading data, user interactions, and event logging for **Star Citizen** players.

## 🚀 Features

- ✅ Slash command support
- ✅ Dynamic command registration
- ✅ Sequelize ORM integration
- ✅ Event-driven architecture (reaction adds/removes, message updates, etc.)
- ✅ Log file creation & Discord log channel syncing
- ✅ Handles guild member updates & role assignments
- ✅ Modular design for scalability

## 🛠️ Installation

Clone the repo:

```bash
git clone https://github.com/revathiest/PFC_Quartermaster.git
cd PFC_Quartermaster
```

Install dependencies:

```bash
npm install
```

Run the full setup (install + tests):

```bash
npm run setup
```

## 🛠️ Configuration

Create a `config.json` file in the project root with the following structure:

```json
{
  "token": "your-discord-bot-token",
  "guildId": "your-discord-guild-id",
  "clientId": "your-discord-client-id",
  "SCAPIkey": "your-star-citizen-api-key",
  "botPermsReq": "2147483648",
  "bot_type": "Development",
  "wallOfFameChannelId": "your-wall-of-fame-channel-id"
}
```

> ⚠️ **Important:** This file contains sensitive information.  
> Be sure to **add `config.json` to `.gitignore`** to avoid committing it.

Each field is required:

- `token`: Your Discord bot token
- `guildId`: ID of the Discord server where the bot operates
- `clientId`: Your bot's Discord client ID
- `SCAPIkey`: API key for external services (e.g. Star Citizen)
- `botPermsReq`: Bot permissions integer (default `2147483648`)
- `bot_type`: `"Development"` or `"Production"`
- `wallOfFameChannelId`: Channel ID for special logging/events

## 🌐 Environment Variables

The bot also relies on several environment variables. The project uses
[dotenv](https://github.com/motdotla/dotenv) to load a `.env` file in the
project root, or you can export them in your shell before running the bot.

- `BOT_TYPE` - Selects the runtime environment for the database and other
  settings. Defaults to `development` if not provided.
- `OPENAI_API_KEY` - API key used for OpenAI requests.
- `OPENAI_MODEL` - Model name to use when calling the OpenAI API.
- `UEX_API_TOKEN` - Authentication token for the UEX trading API.

## 🏃‍♂️ Usage

Run the bot:

```bash
node bot.js
```

For development with auto-reload:

```bash
node bot.js
```

Restart the command after each change, or use a tool like `nodemon` to
watch your files and automatically restart the bot during development.

## 📂 Project Structure

```text
bot.js                 # Main bot entrypoint
/botactions/           # Event handlers & bot actions
/config/                # Configuration & database setup
/utils/                 # Command registration utilities
/logs/                  # Auto-generated log files
```

## 🧪 Testing

Testing is configured with **Jest**. Run:

```bash
npm test
```

## 🤝 Contributing

Pull requests welcome! Please adhere to conventional commits and write tests for any new features.

## 📜 License

This project is licensed under the **ISC License**.

---

Built with ❤️ by Kenneth Hart
