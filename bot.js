// Require the necessary discord.js classes
const { Discord, Client, GatewayIntentBits, Collection, EmbedBuilder, InteractionType, PermissionFlagsBits, Partials} = require('discord.js');
const { REST } = require('@discordjs/rest');
const { VoiceConnectionStatus } = require('@discordjs/voice');
const { Routes } = require('discord-api-types/v9');
const { bot_type, clientId, guildId, token } = require('./config.json');
const fs = require('fs'); // imports the file io library
const rest = new REST({ version: '9' }).setToken(token);
const { initClient } = require('./botactions/initClient');
const interactionHandler = require('./botactions/interactionEvents');
const { handleMessageCreate } = require('./botactions/messageEvents');
const { registerChannels } = require('./botactions/channelRegistry');


const client = initClient();

client.on('interactionCreate', async interaction => {
    await interactionHandler.handleInteraction(interaction, client);
});

client.on("messageCreate", message => handleMessageCreate(message, client));

//PFC Discord Role Definitions
var roleWatermelon = '999136367554613398'

//This creates the commands so that they can be run.
client.commands = new Collection();
var cmdsToRegister = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

console.log('====Registering Star Citizen Commands: ');
for (const file of commandFiles) {
    const command = require('./commands/' + file);
    try {
        client.commands.set(command.data.name, command);
        if (typeof command.data === 'object' && command.data !== null) {
            cmdsToRegister.push(command.data.toJSON ? command.data.toJSON() : command.data);
        } else {
            cmdsToRegister.push(command.data);
        }
        console.log(`Registered command ${command.data.name}`);
    } catch (error) {
        console.error(error);
    }
}

(async() => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId), {
            body: cmdsToRegister
        }, )

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

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

    client.channels.cache.get(client.chanBotLog).send('Startup Complete!');
});

    if (isDevelopment()) {
        client.chanSCNews = client.chanBotLog;
    }


    try {
        setInterval(checkEvents, 60000);
        console.log('Check Events interval successfully started');
    } catch (error) {
        console.error(`Error setting up interval: ${error}`);
    }

    try {
        deleteMessages();
        setInterval(deleteMessages, 86400000);
        console.log('Clearing Snap Channels')
    } catch (error) {
        console.error(`Error setting up interval: ${error}`);
    }

    remindNewbs();

    getInactiveUsersWithSingleRole();

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

async function checkEvents() {

    // Get the server's Guild object
    const guild = client.guilds.cache.get('818666637858177046');

    // Get the events Map object for the server
    //const eventsMap = guild.scheduledEvents;

    // Get the values of the events Map object and convert them to an array
    const events = Array.from(guild.scheduledEvents.cache.values());

    // Get an array of channel IDs to send the message to
    const channelIds = [
        '818880051486916609', //pfc-lobby
        //'818924486886817802', //pfc-events
        //'818667376824287242' //corpsmen-chat
    ];

    // Send reminders for each event to each channel
    for (const event of events) {
        // Calculate time difference between current time and event start time
        const timeDiff = event.scheduledStartTimestamp - Date.now();

        // Check if time difference is within 60 seconds of the interval or matches the interval
        const intervals = {
            604800000: '1 week',
            259200000: '3 days',
            86400000: '1 day',
            3600000: '1 hour',
            0: 'starting time',
        };

        for (const interval in intervals) {
            if (timeDiff <= interval && timeDiff >= interval - 60000) {
                // Send reminder message to each designated channel
                for (const channelId of channelIds) {
                    const channel = client.channels.cache.get(channelId);
                    const message = (interval === "0") ? `Reminder: Event "${event.name}" is starting now! Join here: ${event.url}` : `Reminder: Event "${event.name}" starts in ${intervals[interval]}. Sign up here: ${event.url}`;
                    await channel.send(message);
                }
                break;
            }
        }
    }
}

async function deleteMessages() {
    try {
        const channelsData = fs.readFileSync('snapchannels.json');
        const channels = JSON.parse(channelsData);

        for (const channelInfo of channels) {
            try {
                const channel = await client.channels.fetch(channelInfo.channelId);

                if (channel && (channel.type === 0 || channel.type === 5)) {
                    const messages = await channel.messages.fetch({
                        limit: 100
                    });
                    const purgeTime = new Date();
                    purgeTime.setDate(purgeTime.getDate() - channelInfo.purgeTimeInDays);

                    // Filter messages based on their timestamps
                    const messagesToDelete = messages.filter(msg => msg.createdTimestamp <= purgeTime.getTime());

                    try {
                        // Bulk delete messages and log the action
                        if (messagesToDelete.size > 0) {
                            await channel.bulkDelete(messagesToDelete, true);
                            console.log(`Deleted ${messagesToDelete.size} messages in channel ${channel.name}`);
                        } else {
                            console.log(`No messages to delete in channel ${channel.name}`);
                        }
                    } catch (bulkDeleteError) {
                        console.log(`Bulk delete failed. Attempting to delete messages one at a time in channel ${channel.name}`);
                        // Attempt to delete messages one by one
                        for (const message of messagesToDelete.values()) {
                            try {
                                await message.delete();
                                console.log(`Deleted message ${message.id} individually`);
                            } catch (deleteError) {
                                console.error(`Failed to delete message ${message.id}: ${deleteError}`);
                            }
                        }
                    }
                } else {
                    console.log(`Invalid channel type or channel does not exist: ${channelInfo.channelId}`);
                }
            } catch (error) {
                if (error.code === 10003) {
                    console.error(`Error: Unknown Channel with ID ${channelInfo.channelId}`);
                } else {
                    console.error(`Error handling channel ${channelInfo.channelId}: ${error}`);
                }
            }
        }
    } catch (error) {
        console.error('Error deleting messages:', error);
    }
}

async function getusername(streamFactory, dataConsumer) {
    try {
        streamFactory().then((response) => {
            dataConsumer(response)
        });
    } catch (error) {
        console.warn('Stream disconnected with error: ', error.stack);
    }
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
    const logchannel = client.channels.cache.get(client.chanBotLog);

    // Condition: User didn't have the role before but does now.
    if (!oldMember.roles.cache.has(roleWatermelon) && newMember.roles.cache.has(roleWatermelon)) {
        try {
            // Fetch the guild's audit logs.
            const fetchedLogs = await newMember.guild.fetchAuditLogs({
                limit: 1,
                type: 25
            });

            const roleChangeLog = fetchedLogs.entries.first();
            if (!roleChangeLog) {
                logchannel.send("No audit log found for role update.");
                return;
            }

            // Check the executor of the role addition.
            const { executor, target } = roleChangeLog;

            // Ensure the target of the log and the updated member are the same, and the executor is the user themselves.
            if (target.id === newMember.id && executor.id === newMember.id) {
                logchannel.send(`User ${newMember.user.username} has assigned themselves the watermelon role.`);
                
                // Attempt to ban the user
                await newMember.ban({ reason: 'Automatically banned for self-assigning the watermelon role.' });
                logchannel.send(`Automatically banned ${newMember.user.tag}.`);
            } else {
                logchannel.send(`${newMember.user.tag} was given the watermelon role by someone else.`);
            }
        } catch (error) {
            logchannel.send(`An error occurred when checking the audit logs or banning the user: ${error}`);
        }
    }
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
