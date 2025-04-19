// Require the necessary discord.js classes
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { initClient } = require('./botactions/initClient');
const { interactionHandler, handleMessageCreate, handleReactionAdd, handleReactionRemove, handleVoiceStateUpdate } = require('./botactions/eventHandling');
const { registerChannels, deleteMessages } = require('./botactions/channelManagement');
const registerCommands = require('./utils/commandRegistration');
const { initializeDatabase } = require('./config/database');
const { loadConfiguration } = require('./botactions/configLoader');
const { checkScheduledAnnouncements, checkEvents } = require('./botactions/scheduling');
const { getInactiveUsersWithSingleRole, handleRoleAssignment } = require('./botactions/userManagement');
const { handleCreateEvent, handleUpdateEvent, handleDeleteEvent, syncEventsInDatabase } = require('./botactions/eventHandling/scheduledEvents');

const botType = process.env.BOT_TYPE;

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const now = new Date();
const pad = (n) => n.toString().padStart(2, '0');
const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

const logFileName = `bot-${timestamp}.log`;
const logFilePath = path.join(logDir, logFileName);

const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });


const origConsoleError = console.error;
const origConsoleLog = console.log;

console.error = (...args) => {
  logStream.write('[ERROR] ' + args.join(' ') + '\n');
  origConsoleError(...args);
};

console.log = (...args) => {
  logStream.write('[LOG] ' + args.join(' ') + '\n');
  origConsoleLog(...args);
};



// Load configuration before initializing the client
const initializeBot = async () => {
    const config = await loadConfiguration(botType);

    const token = config.token || fileToken;
    if (!token) {
        console.error('❌ No token found in configuration.');
        return;
    }

    const client = initClient();
    client.config = config;

    client.on('interactionCreate', async interaction => {
        await interactionHandler.handleInteraction(interaction, client);
    });

    client.on("messageCreate", message => handleMessageCreate(message, client));
    client.on('messageReactionAdd', (reaction, user) => handleReactionAdd(reaction, user));
    client.on('messageReactionRemove', (reaction, user) => handleReactionRemove(reaction, user));
    client.on("voiceStateUpdate", (oldState, newState) => handleVoiceStateUpdate(oldState, newState, client));
    client.on('guildScheduledEventCreate', async (guildScheduledEvent) => handleCreateEvent(guildScheduledEvent, client));
    client.on('guildScheduledEventUpdate', async (oldEvent, newEvent) => handleUpdateEvent(oldEvent, newEvent, client));
    client.on('guildScheduledEventDelete', async (guildScheduledEvent) => handleDeleteEvent(guildScheduledEvent, client));

    client.on('error', (error) => {
        const logChannel = client.channels.cache.get(client.chanBotLog);
        if (logChannel) {
            logChannel.send('⚠️ Error: (client)' + error.stack);
        }
        console.error('💥 Client error event:', error);
    });

    client.on("userUpdate", function (oldMember, newMember) {
        console.log(`🔄 A guild member's presence changed`);
    });

    client.on("guildMemberUpdate", async (oldMember, newMember) => {
        await handleRoleAssignment(oldMember, newMember, client);
    });

    client.once('ready', async () => {
        console.log('🟢 Discord client is ready!');
        try {
            await initializeDatabase();
            await registerChannels(client);
            await registerCommands(client);
            await getInactiveUsersWithSingleRole(client);
            await syncEventsInDatabase(client);
            setInterval(() => checkScheduledAnnouncements(client), 60000);
            console.log('🚀 Bot setup complete and ready to go!');

            const logChannel = client.channels.cache.get(client.chanBotLog);
            if (logChannel) {
                logChannel.send('✅ Startup Complete!');
            } else {
                console.error('⚠️ Log channel not found.');
            }

            try {
                setInterval(() => checkEvents(client), 60000);
                console.log('⏱️ Check Events interval successfully started');

                await deleteMessages(client);
                setInterval(() => deleteMessages(client), 86400000);
                console.log('🧹 Delete Messages interval successfully started');
            } catch (error) {
                console.error(`❌ Error setting up interval: ${error}`);
            }

        } catch (error) {
            console.error('❗ Error during bot setup:', error);
        }
    });

    try {
        await client.login(token);
    } catch (error) {
        console.error('🚫 Failed to login:', error);
    }
};

// Start the bot
initializeBot();
