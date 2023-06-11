// Require the necessary discord.js classes
const { Discord, Client, GatewayIntentBits, Collection, EmbedBuilder, InteractionType, PermissionFlagsBits, Partials} = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const Twitter = require('twitter-v2'); // Imports the twitter library
const fs = require('fs'); // imports the file io library
const { bot_type, clientId, guildId, token, dbinfo, twitter, countForSpam } = require('./config.json');
const rest = new REST({ version: '9' }).setToken(token);
const { process_messages } = require("./process_messages");
const { getvariable, setvariable, writeVariablesToFile } = require('./botactions/variablehandler.js');
const { VoiceConnectionStatus } = require('@discordjs/voice');

//PFC Discord Channel Definitions
var chanBotLog
var chanBotTest
var chanSCNews
var chanPFCMusic
var chanPFCRules

// Create a new client instance
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

//***********************************************************/
//Twitter setup
//***********************************************************/


const twitterClient = new Twitter(twitter);
const {
    twitterchans
} = require('./config.json');
const {
    updaterules
} = require('./botactions/updaterules');

var twitfollow = '';

for (var key in twitterchans) {
    if (twitterchans.hasOwnProperty(key)) {
        if (twitfollow == '') {
            twitfollow = twitterchans[key]
        } else {
            twitfollow += ',' + twitterchans[key]
        }
    }
};

async function listenForever(streamFactory, dataConsumer) {
    while (true) {
        try {
            const response = streamFactory();
            for await(const {
                meta,
                data
            }
                of response) {
                if (meta.result_count > 0) {
                    dataConsumer(data);
                }
            }
            console.log('Stream disconnected healthily. Reconnecting.');
        } catch (error) {
            console.warn('Stream disconnected with error. Retrying.', error);
        }
        await new Promise(resolve => setTimeout(resolve, 30000));
    }
}

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

client.on('interactionCreate', async interaction => {
    const roles = interaction.member._roles;
    const command = client.commands.get(interaction.commandName);

    if (interaction.isCommand()) {
        let message = `${interaction.user.username} used command **${interaction.commandName}**`;
        if (interaction.options._hoistedOptions[0]) {
            message += ` with options **${interaction.options._hoistedOptions[0].value}**`;
        }
        client.channels.cache.get(chanBotLog).send(message);

        if (command && command.role && !roles.includes(command.role)) {
            await interaction.reply("You're not authorized to use that command");
            return;
        }

        if (!command) {
            await interaction.reply('Unable to find command...');
            return;
        }

        try {
            if (typeof command.execute === 'function') {
                await command.execute(interaction, client);
            } else {
                command(interaction);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
        }
    } else if (interaction.isButton()) {
        const message = `${interaction.user.username} clicked button **${interaction.customId}** for command **${interaction.message.interaction.commandName}**`;
        client.channels.cache.get(chanBotLog).send(message);

        command = client.commands.get(interaction.message.interaction.commandName);
        command.button(interaction, client);
    } else if (interaction.isSelectMenu()) {
        const message = `${interaction.user.username} selected option **${interaction.values[0]}** for command **${interaction.message.interaction.commandName}**`;
        client.channels.cache.get(chanBotLog).send(message);

        command = client.commands.get(interaction.message.interaction.commandName);
        command.option(interaction, client);
    } else {
        interaction.log(interaction);
        interaction.reply('I dont know what to do with that');
    }
});

client.on('messageReactionAdd', async(reaction, user) => {
    const channelName = reaction.message.channel.name;
    const reactionIcon = reactionroles.reactionroles[channelName]?.[reaction.emoji.name];

    if (reactionIcon) {
        const role = reaction.message.guild.roles.cache.find(role => role.name === reactionIcon.name);
        const member = await reaction.message.guild.members.fetch(user.id);

        if (role && member) {
            await member.roles.add(role.id);

            const logChannel = client.channels.cache.get(chanBotLog);
            logChannel.send(`${user.username} clicked the ${reactionIcon.icon} reaction`);
            logChannel.send(`${reactionIcon.name} role was added to ${member.user.username}`);
        } else {
            console.log('Role or member not found.');
        }
    }
});

client.on('messageReactionRemove', async(reaction, user) => {
    const channelName = reaction.message.channel.name;
    const reactionIcon = reactionroles.reactionroles[channelName]?.[reaction.emoji.name];

    if (reactionIcon) {
        const role = reaction.message.guild.roles.cache.find(role => role.name === reactionIcon.name);
        const member = await reaction.message.guild.members.fetch(user.id);

        if (role && member) {
            await member.roles.remove(role.id);

            const logChannel = client.channels.cache.get(chanBotLog);
            logChannel.send(`${user.username} clicked the ${reactionIcon.icon} reaction`);
            logChannel.send(`${reactionIcon.name} role was added to ${member.user.username}`);
        } else {
            console.log('Role or member not found.');
        }
    }
});

client.on('error', (error) => {
    client.channels.cache.get(chanBotLog).send('Error: (client)' + error.stack)
})

client.on("userUpdate", function (oldMember, newMember) {
    const membername = newMember.nickname
        console.log(`a guild member's presence changes`);
});

// When the client is ready, run this code (only once)
client.once('ready', async() => {
    console.log('Ready!');

    for (const channel of client.channels.cache.values()) {
        if (channel.type == 0) {
            switch (channel.name) {
            case 'star-citizen-news':
                chanSCNews = channel.id;
                console.log(`Channel ${channel.name} registered.`);
                break;
            case 'pfc-bot-testing':
                chanBotTest = channel.id;
                console.log(`Channel ${channel.name} registered.`);
                break;
            case 'pfc-bot-activity-log':
                chanBotLog = channel.id;
                console.log(`Channel ${channel.name} registered.`);
                break;
            case 'music':
                chanPFCMusic = channel.id;
                console.log(`Channel ${channel.name} registered.`);
                break;
            case 'rules':
                chanPFCRules = channel.id;
                console.log(`Channel ${channel.name} registered.`);
                break;
            case 'division-signup':
                chanDivSignup = channel.id;
                console.log(`Channel ${channel.name} registered.`);
            default:
                break;
            }
        }
    }

    if (isDevelopment()) {
        chanSCNews = chanBotLog;
        chanPFCMusic = chanBotLog;
        chanPFCRules = chanBotLog;
    }

    client.chanSCNews = chanSCNews;
    client.chanPFCMusic = chanPFCMusic;
    client.chanPFCRules = chanPFCRules;
    client.chanDivSignup = chanDivSignup;
    client.chanBotLog = chanBotLog;
    client.chanBotTest = chanBotTest;

    client.channels.cache.get(chanBotLog).send('Startup Complete!');

    const rulesChan = isProduction() ? chanPFCRules : chanBotTest;

    await updaterules(client, rulesChan, chanBotLog);

    const twitchans = Object.values(twitterchans).join(' OR from:');

    getvariable(client, 'messagecount', function (response) {
        messagecount = response
    })



    listenForever(
        () =>
        twitterClient.stream('tweets/search/recent', {
            query: `from:${twitchans}`,
            start_time: new Date(new Date() - 42000).toISOString(),
            end_time: new Date(new Date() - 12000).toISOString(),
            expansions: 'author_id,referenced_tweets.id',
        }),
        (message) => {
        if (
            message[0].referenced_tweets &&
            message[0].referenced_tweets.some(
                (referencedTweet) => referencedTweet.type === 'retweeted' || referencedTweet.type === 'replied_to')) {
            return; // Ignore retweets
        }

        getusername(
            () => twitterClient.get(`users/${message[0].author_id}`),
            (data) => {
            if (data) {
                let newsChan = chanSCNews
                    if (isDevelopment()) {
                        newsChan = chanBotTest
                    }
                    client.channels.cache.get(newsChan).send(
                        `**${data.data.name}** just tweeted this!\n` + 
`https://twitter.com/${data.data.username}/status/${message[0].id}`);
            } else {
                console.log('data is undefined');
            }
        });
    });



    // Set our interval based functions
    // Run checkEvents function every minute
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

    remindRecruits();

    getInactiveUsersWithSingleRole();

    try {
        const data = fs.readFileSync('reactionroles.json');
        reactionroles = JSON.parse(data);
    } catch (error) {
        console.error('Error reading reactionroles.json:', error);
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

    const channel = client.channels.cache.get(chanBotLog);
    if (channel) {
        channel.send(message)
        .then(() => console.log(`Inactive users with single role list sent to channel ${chanBotLog}`))
        .catch(console.error);
    } else {
        console.log(`Channel ${chanBotLog} not found.`);
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
    const channel = client.channels.cache.get("1026641140193185842");
    const rules = client.channels.cache.get("1110719388723707914");
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

async function remindRecruits() {
    const channel = client.channels.cache.get("992875093325795409");
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const currentHour = currentDate.getHours();

    if (dayOfWeek !== 1 || currentHour >= 1) {
        console.log("Current time is not between midnight and 1 am on Monday. Recruit reminder not sent");
        return;
    }

    channel.send("@Recruit Please remember to apply for membership on https://robertsspaceindustries.com/orgs/PFCS")
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
            const channel = await client.channels.fetch(channelInfo.channelId);

            if (channel.type === 0 || channel.type === 5) {
                const messages = await channel.messages.fetch({
                    limit: 100
                });

                // Calculate the timestamp for the specified purge time
                const purgeTime = new Date();
                purgeTime.setDate(purgeTime.getDate() - channelInfo.purgeTimeInDays);

                // Filter messages based on their timestamps
                const messagesToDelete = messages.filter(msg => msg.createdTimestamp <= purgeTime);

                try {
                    await channel.bulkDelete(messagesToDelete);
                    console.log(`Deleted messages in channel ${channel.name}`);
                } catch (bulkDeleteError) {
                    console.log(`Bulk delete failed. Attempting to delete messages one at a time in channel ${channel.name}`);

                    let failedMessages = [];
                    for (const messageToDelete of messagesToDelete.values()) {
                        try {
                            await messageToDelete.delete();
                            console.log(`Deleted message ${messageToDelete.id}`);
                        } catch (deleteError) {
                            console.error(`Failed to delete message ${messageToDelete.id}:`, deleteError);
                            failedMessages.push(messageToDelete);
                        }
                    }

                    if (failedMessages.length === 0) {
                        console.log(`All messages deleted in channel ${channel.name}`);
                    } else {
                        console.log(`Failed to delete ${failedMessages.length} messages in channel ${channel.name}`);
                    }
                }
            } else {
                console.log(`Invalid channel type. Skipping channel ${channel.name}`);
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

// Login to Discord with your client's token
client.login(token)

//***********************************************************/
//This is the chat reaction section
//***********************************************************/
var messagecount

var allowmessage = true;
const countBasedChatter = require('./countBasedChatter.json');
const {
    channel
} = require('diagnostics_channel');
var channelid
client.on("messageCreate", function (message) {
    // Check if the message is sent in a guild (server)
    if (!message.guild) {
        return;
    }

    process_messages(message, allowmessage);

    if (!messagecount) {
        messagecount = {};
    }

    if (isProduction() && !message.author.bot) {
        messagecount[message.channel.id] = (messagecount[message.channel.id] > countForSpam) ? 0 : (messagecount[message.channel.id] || 0) + 1;
        setvariable(client, 'messagecount', messagecount)
        if (messagecount[message.channel.id] == countForSpam) {
            channelid = message.channel.id
                sendMessage(client, channelid)
        }
    }

    const channel = message.channel;
    const member = message.member;

    const rulesChan = message.guild.channels.cache.find(c => c.name === 'rules');
    if (rulesChan) {
        const rulesLink = `<#${rulesChan.id}>`;
        if (channel.name === 'newb-zone' && member.roles.cache.size === 1) {
            channel.send('If you go to the ' + rulesLink + ' channel and react to the appropriate selection, I will assign you the correct roles.')
            .then(sentMessage => console.log(`Message sent to channel ${channel.id}: ${sentMessage.content}`))
            .catch(console.error);
        }
    }
});

async function sendMessage(client, channelId) {
    try {
        const data = await fs.promises.readFile('./countBasedChatter.json', 'utf8');
        console.log("Read random messages json");

        const statements = JSON.parse(data);
        console.log("Parsed data into Statements");
        const randomStatementKey = getRandomStatementKey(statements);
        console.log("Selected random statement key");
        const randomStatement = statements[randomStatementKey];
        console.log("Found random statement");
        const channel = client.channels.cache.get(channelId);
        console.log("Found channel");

        if (channel && channel.send) {
            console.log("Sending message");
            try {
                await channel.send(randomStatement);
                console.log("Message sent to channel: " + channel.toString());
            } catch (err) {
                console.log('Error sending message:', err);
            }
        }
    } catch (error) {
        console.log(error);
    }
}

function getRandomStatementKey(statements) {
    const keys = Object.keys(statements);
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
}

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

function getBotType() {
    return bot_type
}
