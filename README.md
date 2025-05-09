
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

Create a `.env` file or equivalent config with your bot token:

```env
DISCORD_TOKEN=your-bot-token
```

## 🏃‍♂️ Usage

Run the bot:

```bash
node bot.js
```

For development with auto-reload:

```bash
npm run dev
```

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
