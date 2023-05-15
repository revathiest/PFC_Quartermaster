// Require the necessary discord.js classes
const { Discord, Client, GatewayIntentBits, Collection, EmbedBuilder, InteractionType, PermissionFlagsBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const Twitter = require('twitter-v2'); // Imports the twitter library
const fs = require('fs'); // imports the file io library
const { Player } = require("discord-music-player"); // required for music functionality
const { bot_type, clientId, guildId, token, dbinfo, twitter, reactionroles} = require('./config.json');
const rest = new REST({ version: '9' }).setToken(token);
const{ process_messages } = require("./process_messages");
const{getvariable, setvariable} = require('./botactions/variablehandler.js');

//PFC Discord Channel Definitions
var chanBotLog
var chanBotTest
var chanSCNews
var chanPFCMusic
var chanPFCRules

// Create a new client instance
const client = new Client({ intents: [
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
]});

//***********************************************************/
//Twitter setup
//***********************************************************/

const twitterClient = new Twitter(twitter);
const {twitterchans} = require('./config.json');
const { updaterules } = require('./botactions/updaterules');

var twitfollow = '';

for(var key in twitterchans){
	if (twitterchans.hasOwnProperty(key)){
		if (twitfollow == ''){
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
		for await (const { meta, data } of response) {
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
  

//***********************************************************/
//Music Player Setup
//***********************************************************/

const player = new Player(client, {
    leaveOnEmpty: true,
	leaveOnStop: false,
	leaveOnEnd: false// This options are optional.
});

client.player = player;

player
    // Emitted when channel was empty.
    .on('channelEmpty',  (queue) =>
        client.channels.cache.get(chanBotLog).send('Everyone left the Voice Channel, queue ended.'))
    // Emitted when a song was added to the queue.
    .on('songAdd',  (queue, song) =>
        client.channels.cache.get(chanPFCMusic).send('Song ' + song + ' was added to the queue.'))
    // Emitted when a playlist was added to the queue.
    .on('playlistAdd',  (queue, playlist) =>
        client.channels.cache.get(chanPFCMusic).send('Playlist ' + playlist + ' with ' + playlist.songs.length + ' was added to the queue.'))
    // Emitted when there was no more music to play.
    .on('queueEnd',  (queue) =>
		client.channels.cache.get(chanPFCMusic).send('The queue has ended.'))
    // Emitted when the queue was destroyed (either by ending or stopping).
    .on('queueDestroyed',  (queue) =>
		client.channels.cache.get(chanPFCMusic).send('The queue was destroyed.'))
	//Emitted wahen the queue is cleared.
	.on('queueCleared', (queue) =>
		client.channels.cache.get(chanPFCMusic).send('Queue was cleared.'))
    // Emitted when a song changed.
    .on('songChanged', (queue, newSong, oldSong) => 
        client.channels.cache.get(chanPFCMusic).send('**Now Playing:** ' + newSong))
    // Emitted when a first song in the queue started playing.
    .on('songFirst',  (queue, song) =>
        client.channels.cache.get(chanPFCMusic).send('Started playing ' + song + '.'))
    // Emitted when someone disconnected the bot from the channel.
    .on('clientDisconnect', (queue) =>
        client.channels.cache.get(chanBotLog).send('I was kicked from the Voice Channel, queue ended.'))
    // Emitted when deafenOnJoin is true and the bot was undeafened
    .on('clientUndeafen', (queue) =>
        client.channels.cache.get(chanBotLog).send('I got undefeanded.'))
    // Emitted when there was an error in runtime
    .on('error', (error, queue) => {
        client.channels.cache.get(chanBotLog).send('Error: (music)' + error.stack)
    });

//This creates the commands so that they can be run.
client.commands = new Collection();
var cmdsToRegister = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const playercommandFiles = fs.readdirSync('./commands/musiccommands').filter(file => file.endsWith('.js'));

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

console.log('====Registering Music Commands: ');
for (const file of playercommandFiles) {
  try {
    const command = require(`./commands/musiccommands/${file}`);
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

  

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: cmdsToRegister },
		)

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
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
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
  

  client.on('messageReactionAdd', async (reaction, user) => {
	const channelName = reaction.message.channel.name;
	const reactionIcon = reactionroles[channelName]?.[reaction.emoji.name];
  
	if (reactionIcon) {
	  const role = reaction.message.guild.roles.cache.find(role => role.name === reactionIcon.name);
	  const member = await reaction.message.guild.members.fetch(user.id);
  
	  await member.roles.add(role.id);
  
	  const logChannel = client.channels.cache.get(chanBotLog);
	  logChannel.send(`${user.username} clicked the ${reactionIcon.icon} reaction`);
	  logChannel.send(`${reactionIcon.name} role was added to ${member.user.username}`);
	}
  });
  

  client.on('messageReactionRemove', async (reaction, user) => {
	const channelName = reaction.message.channel.name;
	const reactionIcon = reactionroles[channelName]?.[reaction.emoji.name];
  
	if (reactionIcon) {
	  const role = reaction.message.guild.roles.cache.find(role => role.name === reactionIcon.name);
	  const member = await reaction.message.guild.members.fetch(user.id);
  
	  await member.roles.remove(role.id);
  
	  const logChannel = client.channels.cache.get(chanBotLog);
	  logChannel.send(`${user.username} removed the ${reactionIcon.icon} reaction`);
	  logChannel.send(`${reactionIcon.name} role was removed from ${member.user.username}`);
	}
  });
  

client.on('error', (error) => {
	client.channels.cache.get(chanBotLog).send('Error: (client)' + error.stack)
})
	
client.on("userUpdate", function(oldMember, newMember){
	const membername = newMember.nickname
	console.log(`a guild member's presence changes`);
});

// When the client is ready, run this code (only once)
client.once('ready', async () => {
	console.log('Ready!');
  
	for (const channel of client.channels.cache.values()) {
	  if (channel.type == 0) {
		switch (channel.name) {
		  case 'star-citizen-news':
			chanSCNews = channel.id;
			client.chanSCNews = chanSCNews;
			console.log(`Channel ${channel.name} registered.`);
			break;
		  case 'pfc-bot-testing':
			chanBotTest = channel.id;
			client.chanBotTest = chanBotTest;
			console.log(`Channel ${channel.name} registered.`);
			break;
		  case 'pfc-bot-activity-log':
			chanBotLog = channel.id;
			client.chanBotLog = chanBotLog;
			console.log(`Channel ${channel.name} registered.`);
			break;
		  case 'music':
			chanPFCMusic = channel.id;
			client.chanPFCMusic = chanPFCMusic;
			console.log(`Channel ${channel.name} registered.`);
			break;
		  case 'rules':
			chanPFCRules = channel.id;
			client.chanPFCRules = chanPFCRules;
			console.log(`Channel ${channel.name} registered.`);
			break;
		  default:
			break;
		}
	  }
	}
  
	const messages = await client.channels.cache.get('996129261985480704').messages.fetch({ limit: 100 });
	console.log(`Retrieved ${messages.size} messages from #division-signup.`);
  
	client.channels.cache.get(chanBotLog).send('Startup Complete!');
  
	const rulesChan = isProduction() ? chanPFCRules : chanBotTest;
  
	await updaterules(client, rulesChan, chanBotLog);
  
	const twitchans = Object.values(twitterchans).join(' OR from:');
  
	listenForever(
	  () =>
		twitterClient.stream('tweets/search/recent', {
		  query: `from:${twitchans}`,
		  start_time: new Date(new Date() - 42000).toISOString(),
		  end_time: new Date(new Date() - 12000).toISOString(),
		  expansions: 'author_id',
		}),
	  (message) => {
		getusername(
		  () => twitterClient.get(`users/${message[0].author_id}`),
		  (data) => {
			if (data) {
			  client.channels.cache.get(chanSCNews).send(
				`**${data.data.name}** just tweeted this!\n` +
				`https://twitter.com/${data.data.username}/status/${message[0].id}`
			  );
			} else {
			  console.log('data is undefined');
			}
		  }
		);
	  }
	);
  
	// Set our interval based functions
	// Run checkEvents function every minute
	try {
	  setInterval(checkEvents, 60000);
	  console.log('Check Events interval successfully started');
	} catch (error) {
	  console.error(`Error setting up interval: ${error}`);
	}
  });
  

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
		86400000: '1 day',
		28800000: '8 hours',
		14400000: '4 hours',
		7200000: '2 hours',
		3600000: '1 hour',
		1800000: '30 minutes',
		900000: '15 minutes',
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
client.on("presenceUpdate", function(oldMember, newMember){
	//var tempnewMember = newMember.member.displayName
    //console.log(`a guild member's presence changes: ` + tempnewMember);
});

// Login to Discord with your client's token
client.login(token)

//***********************************************************/
//This is the chat reaction section
//***********************************************************/
var messagecount
getvariable(client,'messagecount', function(response){
	messagecount = response
})
var allowmessage = true;
const countBasedChatter = require('./countBasedChatter.json')

client.on("messageCreate", function(message) {
	allowmessage = process_messages(message, allowmessage);
  
	if (!messagecount) {
	  messagecount = {};
	}
	
	if (isProduction()) {
	  messagecount[message.channel.id] = (messagecount[message.channel.id] || 0) + 1;
	  setvariable(client, 'messagecount', messagecount);
	}
	setInterval(() => {
	 allowmessage = true;
	 console.log("Bot Spam Timer elapsed")
	}, 60000);
  });

function isProduction(){
	if (bot_type == "production"){
		return true;
	} else {
		return false;
	}
}

function isDevelopment(){
	if (bot_type == "development"){
		return true;
	} else {
		return false;
	}
}

function getBotType(){
	return bot_type
}