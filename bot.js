// Require the necessary discord.js classes
require('dotenv').config();
const { initClient } = require('./botactions/initClient');
const { interactionHandler, handleMessageCreate, handleReactionAdd, handleReactionRemove, handleVoiceStateUpdate } = require('./botactions/eventHandling');
const { registerChannels, deleteMessages } = require('./botactions/channelManagement');
const { registerCommands } = require('./utils/commandRegistration');
const { initializeDatabase } = require('./config/database');
const { loadConfiguration } = require('./botactions/configLoader');
const { checkScheduledAnnouncements, checkEvents } = require('./botactions/scheduling');
const { getInactiveUsersWithSingleRole, handleRoleAssignment } = require('./botactions/userManagement');
const { handleCreateEvent, handleUpdateEvent, handleDeleteEvent, syncEventsInDatabase } = require('./botactions/eventHandling/scheduledEvents');

const botType = process.env.BOT_TYPE;

// Load configuration before initializing the client
const initializeBot = async () => {
    const config = await loadConfiguration(botType);

    // Extract the token from the loaded config
    const token = config.token || fileToken;
    if (!token) {
        console.error('No token found in configuration.');
        return;
    }

    // Initialize the client with the loaded config
    const client = initClient();

    // Update client configuration with loaded config
    client.config = config;

    client.on('interactionCreate', async interaction => {
        await interactionHandler.handleInteraction(interaction, client);
    });

    client.on("messageCreate", message => handleMessageCreate(message, client));

    client.on('messageReactionAdd', (reaction, user) => handleReactionAdd(reaction, user));
  
    client.on('messageReactionRemove', (reaction, user) => handleReactionRemove(reaction, user));

    client.on("voiceStateUpdate", (oldState, newState) => handleVoiceStateUpdate(oldState, newState, client));

    // Event listener for scheduled event creation
    client.on('guildScheduledEventCreate', async (guildScheduledEvent) => handleCreateEvent(guildScheduledEvent, client));
    
    client.on('guildScheduledEventUpdate', async (oldGuildScheduledEvent, newGuildScheduledEvent) => handleUpdateEvent(oldGuildScheduledEvent,newGuildScheduledEvent, client));
    
    // Event listener for scheduled event deletion
    client.on('guildScheduledEventDelete', async (guildScheduledEvent) => handleDeleteEvent(guildScheduledEvent, client));

    //***********************************************************/
    //Client Setup
    //***********************************************************/

    client.on('error', (error) => {
        const logChannel = client.channels.cache.get(client.chanBotLog);
        if (logChannel) {
            logChannel.send('Error: (client)' + error.stack);
        }
        console.error('Error event:', error);
    });

    client.on("userUpdate", function (oldMember, newMember) {
        console.log(`A guild member's presence changes`);
    });

    client.on("guildMemberUpdate", async (oldMember, newMember) => {
        await handleRoleAssignment(oldMember, newMember, client);
    });

    // When the client is ready, run this code (only once)
    client.once('ready', async () => {
        console.log('Discord client is ready!');
        try {

            await initializeDatabase();  // Initialize and sync database
            await registerChannels(client);  // Register channels
            await registerCommands(client);
            await getInactiveUsersWithSingleRole(client);
            await syncEventsInDatabase(client);
            setInterval(() => checkScheduledAnnouncements(client), 60000);
            console.log('Bot setup complete and ready to go!');

            const logChannel = client.channels.cache.get(client.chanBotLog);
            if (logChannel) {
                logChannel.send('Startup Complete!');
            } else {
                console.error('Log channel not found.');
            }

            try {
                setInterval(() => checkEvents(client), 60000);
                console.log('Check Events interval successfully started');
                setInterval(() => deleteMessages(client), 86400000);
                console.log('Delete Messages interval successfully started');
            } catch (error) {
                console.error(`Error setting up interval: ${error}`);
            }

        } catch (error) {
            console.error('Error during channel registration:', error);
        }

    });

    // Login to Discord with your client's token
    try {
        await client.login(token);
    } catch (error) {
        console.error('Failed to login:', error);
    }

};

// Start the bot
initializeBot();
