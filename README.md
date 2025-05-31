
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
- ✅ `/loglookup` command for quick audit of recent events (admin only)

## 🛠️ Installation

Clone the repo:

```bash
git clone https://github.com/revathiest/PFC_Quartermaster.git
cd PFC_Quartermaster
```

Install dependencies and run tests:
> **Note:** The bot requires **Node.js 22.13.1**, as specified in `package.json`.
> Using other versions may lead to unexpected issues.

Install dependencies:

```bash
npm install
```

Run the full setup (install + tests):

```bash
npm run setup
```

The `setup` script runs `npm ci` to ensure a clean install and executes the test
suite. Running `npm install` separately is unnecessary.

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

Create a `databaseConfig.json` file in the project root for database settings.  
`config/database.js` loads this file based on the `bot_type` value (`development` or `production`).  
A minimal example is:

```json
{
  "development": {
    "host": "localhost",
    "database": "pfc_db",
    "username": "db_user",
    "password": "db_pass",
    "dialect": "postgres",
    "logging": false
  }
}
```

> ⚠️ **Important:** This file contains sensitive information.  
> Be sure to **add `databaseConfig.json` to `.gitignore`** to avoid committing it.

Fields include:
- `host`: Database host address
- `database`: Database name
- `username`: Database user
- `password`: Password for the database user
- `dialect`: Sequelize dialect (`postgres`, `mysql`, `sqlite`, etc.)
- `logging`: `true` to log SQL queries, `false` to disable

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

| Path | Purpose |
|------|---------|
| bot.js | Main bot entrypoint |
| /botactions/ | Event handlers and bot actions |
| /commands/ | Slash command modules |
| /components/ | UI components for Discord responses |
| /jobs/ | Background job logic (no scheduling) |
| /models/ | Sequelize models |
| /config/ | Configuration and database setup |
| /utils/ | Shared utility modules |
| /__tests__/ | Jest test suites |
| /__mocks__/ | Mock data for tests |

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
