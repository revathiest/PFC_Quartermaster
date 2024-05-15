// Import necessary classes from discord.js
const { Client, GatewayIntentBits, Partials } = require('discord.js');

/**
 * Initializes the Discord client with specific intents and partials.
 * @returns {Client} The configured Discord client.
 */
function initClient() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildScheduledEvents,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildIntegrations,
            GatewayIntentBits.GuildMessageReactions
        ],
        partials: [
            Partials.Message,
            Partials.Channel,
            Partials.Reaction
        ]
    });

    // Event to log when the client is ready
    client.once('ready', () => {
        console.log('Discord client is ready!');
    });

    return client;
}

module.exports = { initClient };
