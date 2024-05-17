// Require the necessary discord.js classes
const { Collection } = require('discord.js');
const fs = require('fs'); // imports the file io library
const { initClient } = require('./botactions/initClient');
const interactionHandler = require('./botactions/interactionEvents');
const { handleMessageCreate } = require('./botactions/messageEvents');
const { registerChannels } = require('./botactions/channelRegistry');
const { deleteMessages } = require('./botactions/messageCleanup');
const { checkEvents } = require('./botactions/eventReminder');
const { handleRoleAssignment } = require('./botactions/autoBanModule');
const { registerCommands } = require('./botactions/commandRegistration');
const { getInactiveUsersWithSingleRole } = require('./botactions/inactiveUsersModule');
const { sequelize } = require('./config/database');
const { getConfigFromDatabase } = require('./botactions/databaseHandler');

const client = initClient();

// Function to load config from file (fallback)
const loadConfigFromFile = () => {
  const rawData = fs.readFileSync('./config.json');
  return JSON.parse(rawData);
};

client.on('interactionCreate', async interaction => {
    await interactionHandler.handleInteraction(interaction, client);
});

client.on("messageCreate", message => handleMessageCreate(message, client));

client.on('error', (error) => {
    client.channels.cache.get(client.chanBotLog).send('Error: (client)' + error.stack)
});

client.on("userUpdate", function (oldMember, newMember) {
    console.log(`a guild member's presence changes`);
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    await handleRoleAssignment(oldMember, newMember, client);
});

// When the client is ready, run this code (only once)
client.once('ready', async () => {
    console.log('Discord client is ready!');
    try {
        await registerChannels(client);  // Register channels
        await registerCommands(client);
        await getInactiveUsersWithSingleRole(client);
        console.log('Bot setup complete and ready to go!');

        await sequelize.sync();
        console.log('Database synced');

        // Load configuration from database
        let config;
        try {
            config = await getConfigFromDatabase();
            if (Object.keys(config).length === 0) {
                console.log('No configuration found in database, loading from file.');
                config = loadConfigFromFile();
            } else {
                console.log('Configuration loaded from database.');
            }
        } catch (error) {
            console.error('Error loading configuration from database, falling back to file:', error);
            config = loadConfigFromFile();
        }

        // Update client configuration with loaded config
        client.config = config;

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
            console.log('Delete Messages interval successfully started')
        } catch (error) {
            console.error(`Error setting up interval: ${error}`);
        }

    } catch (error) {
        console.error('Error during channel registration:', error);
    }
});

// Login to Discord with your client's token
client.login(client.config.token || token);
