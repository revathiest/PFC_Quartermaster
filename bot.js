// Require the necessary discord.js classes
const {Collection} = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { bot_type, clientId, guildId, token } = require('./config.json');
const fs = require('fs'); // imports the file io library
const rest = new REST({ version: '9' }).setToken(token);
const { initClient } = require('./botactions/initClient');
const interactionHandler = require('./botactions/interactionEvents');
const { handleMessageCreate } = require('./botactions/messageEvents');
const { registerChannels } = require('./botactions/channelRegistry');
const { deleteMessages } = require('./botactions/messageCleanup');
const { checkEvents } = require('./botactions/eventReminder');
const { handleRoleAssignment } = require('./botactions/autoBanModule');
const { registerCommands } = require('./botactions/commandRegistration');


const client = initClient();

client.on('interactionCreate', async interaction => {
    await interactionHandler.handleInteraction(interaction, client);
});

client.on("messageCreate", message => handleMessageCreate(message, client));

//***********************************************************/
//Client Setup
//***********************************************************/

client.on('error', (error) => {
    client.channels.cache.get(client.chanBotLog).send('Error: (client)' + error.stack)
})

client.on("userUpdate", function (oldMember, newMember) {
    const membername = newMember.nickname
        console.log(`a guild member's presence changes`);
});

// When the client is ready, run this code (only once)
client.once('ready', async () => {
    console.log('Discord client is ready!');
    try {
        await registerChannels(client);  // Register channels
        await registerCommands(client);
        const logChannel = client.channels.cache.get(client.chanBotLog);
        if (logChannel) {
            logChannel.send('Startup Complete!');
            console.log('Bot setup complete and ready to go!');
        } else {
            console.error('Log channel not found.');
        }
    } catch (error) {
        console.error('Error during channel registration:', error);
    }

    remindNewbs();

    getInactiveUsersWithSingleRole();
    
    client.channels.cache.get(client.chanBotLog).send('Startup Complete!');

    if (isDevelopment()) {
        client.chanSCNews = client.chanBotLog;
    }


    try {
        setInterval(() => checkEvents(client), 60000);
        console.log('Check Events interval successfully started');
    } catch (error) {
        console.error(`Error setting up interval: ${error}`);
    }

    try {
        deleteMessages(client);
        setInterval(() => deleteMessages(client), 86400000);
        console.log('Delete Messages interval successfully started')
    } catch (error) {
        console.error(`Error setting up interval: ${error}`);
    }
});


async function getInactiveUsersWithSingleRole() {
    const server = client.guilds.cache.first();
    const currentTime = new Date(); // Current time
    const oneSecondInMs = 1000;
    const oneMinuteInMs = oneSecondInMs * 60;
    const oneHourInMs = oneMinuteInMs * 60;
    const oneDayInMs = oneHourInMs * 24;
    const oneWeekInMs = oneDayInMs * 7;
    const twoWeeksInMs = oneWeekInMs * 2;
    const usersWithSingleRole = [];

    if (!server) {
        console.log("No active server found.");
        return;
    }

    // Fetch offline members with only one role
    await server.members.fetch({
        force: true
    });

    server.members.cache.each(member => {
        if (member.roles.cache.size === 1 && currentTime - member.joinedAt > twoWeeksInMs) {
            const lastActivity = member.lastMessage ? member.lastMessage.createdAt : member.joinedAt;
            const inactiveDuration = currentTime - lastActivity;
            usersWithSingleRole.push({
                username: member.user.username,
                inactiveDuration: inactiveDuration
            });

            member.kick()
            .then(kickedMember => console.log(`Kicked user: ${kickedMember.user.username}`))
            .catch(console.error);
        }
    });

    const formattedUsers = usersWithSingleRole.map(user => `${user.username} - ${formatDuration(user.inactiveDuration)}`);
    const message = `Users with a single role, joined for more than one week, have been kicked from the server:\n\n${formattedUsers.join('\n')}`;

    const channel = client.channels.cache.get(client.chanBotLog);
    if (channel) {
        channel.send(message)
        .then(() => console.log(`Inactive users with single role list sent to channel ${channel.name}`))
        .catch(console.error);
    } else {
        console.log(`Channel ${client.chanBotLog} not found.`);
    }
}

function formatDuration(duration) {
    const seconds = Math.floor(duration / 1000) % 60;
    const minutes = Math.floor(duration / 1000 / 60) % 60;
    const hours = Math.floor(duration / 1000 / 60 / 60) % 24;
    const days = Math.floor(duration / 1000 / 60 / 60 / 24);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

async function remindNewbs() {
    const channel = await client.channels.fetch("1026641140193185842");
    const rules = await client.channels.fetch("1110719388723707914");
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const currentHour = currentDate.getHours();

    if (dayOfWeek !== 1 || currentHour >= 1) {
        console.log("Current time is not between midnight and 1 am on Monday. Newb reminder not sent");
        return;
    }

    const ruleslink = rules.toString();

    channel.send("@everyone If you're seeing this, you havent reacted to our rules yet.  Please go to " + ruleslink + " and react!")
    channel.send("@everyone If you do not react to the rules within 2 weeks of joining the server, you will be kicked.")
    .then(() => console.log(`Reminder sent to ${channel.name}`))
    .catch(console.error);
}

// presenceUpdate
/* Emitted whenever a guild member's presence changes, or they change one of their details.
PARAMETER    TYPE               DESCRIPTION
oldMember    GuildMember        The member before the presence update
newMember    GuildMember        The member after the presence update    */
client.on("presenceUpdate", function (oldMember, newMember) {
    //var tempnewMember = newMember.member.displayName
    //console.log(`a guild member's presence changes: ` + tempnewMember);
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    await handleRoleAssignment(oldMember, newMember, client);
});


// Login to Discord with your client's token
client.login(token)

function isProduction() {
    if (bot_type == "production") {
        return true;
    } else {
        return false;
    }
}

function isDevelopment() {
    if (bot_type == "development") {
        return true;
    } else {
        return false;
    }
}
