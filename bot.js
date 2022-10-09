// Require the necessary discord.js classes
const { Discord, Client, GatewayIntentBits, Collection, EmbedBuilder, InteractionType, PermissionFlagsBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const Twitter = require('twitter-v2'); // Imports the twitter library
const fs = require('fs'); // imports the file io library
const { Player } = require("discord-music-player"); // required for music functionality
const { bot_type, clientId, guildId, token, dbinfo, twitter} = require('./config.json');
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
	try {
	  var response = streamFactory()
	  for await (const { meta, data } of response) {
		if (meta.result_count > 0) {
			dataConsumer(data);
		}
	  }
	  // The stream has been closed by Twitter. It is usually safe to reconnect.
	  console.log('Stream disconnected healthily. Reconnecting.');
	  setTimeout(() => listenForever(streamFactory, dataConsumer), 30000);
	} catch (error) {
	  // An error occurred so we reconnect to the stream. Note that we should
	  // probably have retry logic here to prevent reconnection after a number of
	  // closely timed failures (may indicate a problem that is not downstream).
	  console.warn('Stream disconnected with error. Retrying.', error);
	  setTimeout(() => listenForever(streamFactory, dataConsumer), 30000);
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

//============================================================================
// This is the PFC Announcement embed
// 20211108 krh Initial Coding
//============================================================================
function announce(message){
    const responseEmbed = new EmbedBuilder()
	.setColor('#0099ff')
	.setTitle('Pyro Freelancer Corps Announcement')
	.setURL('https://discord.js.org/')
	.setAuthor({name:'Pyro Freelancer Corps', iconURL:'https://i.imgur.com/5sZV5QN.png', url:'https://robertsspaceindustries.com/orgs/PFCS'})
	.setDescription('Some description here')
	.setThumbnail('https://i.imgur.com/RdZBmhk.png')
	.addFields(
		{ name: 'Regular field title', value: message.toString() },
		{ name: '\u200B', value: '\u200B' },
		{ name: 'Field 1', value: 'Some value here', inline: true },
		{ name: 'Field 2', value: 'Some value here', inline: true },
	)
	.addFields({name:'Field 3', value: 'Some value here', inline: true})
	.setImage('https://i.imgur.com/RdZBmhk.png')
	.setTimestamp()
	.setFooter({text:'Official PFC Communication', iconURL:'https://i.imgur.com/5sZV5QN.png'});

interaction.reply({ embeds: [responseEmbed] });
};

//This creates the commands so that they can be run.
client.commands = new Collection();
var cmdsToRegister = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const playercommandFiles = fs.readdirSync('./commands/musiccommands').filter(file => file.endsWith('.js'));

console.log('====Registering Star Citizen Commands: ');
for (const file of commandFiles) {
	const command = require('./commands/' + file)
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	try{
		client.commands.set(command.data.name, command);
		try{
			cmdsToRegister.push(command.data.toJSON());
		}catch{
			cmdsToRegister.push(command.data);
		}
		console.log('Registered command ' + command.data.name);
	} catch (error) {
		console.error(error);
	}
};

console.log('====Registering Music Commands: ');
for (const file of playercommandFiles) {
	const command = require('./commands/musiccommands/' + file);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	try{
		client.commands.set(command.data.name, command);
		cmdsToRegister.push(command.data.toJSON());
		console.log('Registered command ' + command.data.name);
	} catch (error) {
		console.error(error);
	}
};

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
	
	var roles = interaction.member._roles;
	var command = client.commands.get(interaction.commandName);

	if (interaction.type === InteractionType.ApplicationCommand) {
		
		var message = interaction.user.username + ' used command **' + interaction.commandName + '**'
		if (interaction.options._hoistedOptions[0] != undefined){
			message = message + ' with options **' +interaction.options._hoistedOptions[0].value + '**'
		}
		client.channels.cache.get(chanBotLog).send(message);
		
		
		if (command.role != undefined){
			if (!roles.includes(command.role)){
				interaction.reply("You're not authorized to use that command");
				return
			}
		}
		
		if (!command) {
			interaction.reply('Unable to find command...');
			return
		}
		
		try {
			if (typeof command.execute === 'function'){
				await command.execute(interaction, client);
			} else {
				command(interaction);
			}
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	} else if(interaction.isButton()) {
		
		var message = interaction.user.username + ' clicked button **' + interaction.customId + '** for command **' + interaction.message.interaction.commandName + '**'
		client.channels.cache.get(chanBotLog).send(message)
		
		command = client.commands.get(interaction.message.interaction.commandName)
		command.button(interaction, client)
	} else if(interaction.isSelectMenu()) {
		
		var message = interaction.user.username + ' selected option **' + interaction.values[0] + '** for command **' + interaction.message.interaction.commandName + '**'
		client.channels.cache.get(chanBotLog).send(message)
		
		command = client.commands.get(interaction.message.interaction.commandName)
		command.option(interaction, client)
	} else {
		interaction.log(interaction)
		interaction.reply('I dont know what to do with that')
	}
})

client.on('messageReactionAdd', (reaction, user) => {
	//Was the reaction in the rules channel?
	if (reaction.message.channel.id == chanPFCRules){
		switch(reaction.emoji.name){
			case 'Flame':
				var userid = user.id
				client.guilds.fetch(guildId).then(guild => {
					client.channels.cache.get(chanBotLog).send(user.username + " clicked the <:Flame:821839818240557136> reaction")
					guild.members.fetch(userid).then(member => {
						member.roles.add('833440108647677953') //Recruit
						client.channels.cache.get(chanBotLog).send("Recruit role was added to " + member.user.username)
					})
				})
				break
			case 'StarCitizen':
				var userid = user.id
				client.guilds.fetch(guildId).then(guild => {
					client.channels.cache.get(chanBotLog).send(user.username + " clicked the <:StarCitizen:821855258136805456> reaction")
					guild.members.fetch(userid).then(member => {
						member.roles.add('823083914116595743') //Stowaway
						client.channels.cache.get(chanBotLog).send("Stowaway role was added to " + member.user.username)
					})
				})
				break
			case '🎖️':
				var userid = user.id
				client.guilds.fetch(guildId).then(guild => {
					client.channels.cache.get(chanBotLog).send(user.username + " clicked the 🎖️ reaction")
					guild.members.fetch(userid).then(member => {
						member.roles.add('833415056783441931') //Affiliate
						client.channels.cache.get(chanBotLog).send("Affiliate role was added to " + member.user.username)
					})
				})
				break
			default:
				console.log(`It's not one of the role reactions`)
				console.log('it was '+ reaction.emoji.name)
		}
	}
})

client.on('messageReactionRemove', (reaction, user) =>{
	//Was the reaction in the rules channel?
	if (reaction.message.channel.id == chanPFCRules){
		switch(reaction.emoji.name){
			case 'Flame':
				var userid = user.id
				client.guilds.fetch(guildId).then(guild => {
					client.channels.cache.get(chanBotLog).send(user.username + " clicked the <:Flame:821839818240557136> reaction")
					guild.members.fetch(userid).then(member => {
						member.roles.remove('833440108647677953') //Recruit
						client.channels.cache.get(chanBotLog).send("Recruit role was removed from " + member.user.username)
					})
				})
				break
			case 'StarCitizen':
				var userid = user.id
				client.guilds.fetch(guildId).then(guild => {
					client.channels.cache.get(chanBotLog).send(user.username + " clicked the <:StarCitizen:821855258136805456> reaction")
					guild.members.fetch(userid).then(member => {
						member.roles.remove('823083914116595743') //Stowaway
						client.channels.cache.get(chanBotLog).send("Stowaway role was removed from " + member.user.username)
					})
				})
				break
			case '🎖️':
				var userid = user.id
				client.guilds.fetch(guildId).then(guild => {
					client.channels.cache.get(chanBotLog).send(user.username + " clicked the 🎖️ reaction")
					guild.members.fetch(userid).then(member => {
						member.roles.remove('833415056783441931') //Affiliate
						client.channels.cache.get(chanBotLog).send("Affiliate role was removed from " + member.user.username)
					})
				})
				break
			default:
				console.log(`It's not one of the role reactions`)
				console.log('it was '+ reaction.emoji.name)
		}
	}
})

client.on('error', (error) => {
		client.channels.cache.get(chanBotLog).send('Error: (client)' + error.stack)
	})
	
client.on("userUpdate", function(oldMember, newMember){
	const membername = newMember.nickname
	console.log(`a guild member's presence changes`);
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!')

	client.channels._cache.forEach(channel => {
		if(channel.type == 0){
			switch(channel.name){
				case 'star-citizen-news':
					chanSCNews = channel.id
					client.chanSCNews = chanSCNews
					console.log("Channel " + channel.name + " registered.")
					break;
				case 'pfc-bot-testing':
					chanBotTest = channel.id
					client.chanBotTest = chanBotTest
					console.log("Channel " + channel.name + " registered.")
					break;
				case 'pfc-bot-activity-log':
					chanBotLog = channel.id
					client.chanBotLog = chanBotLog
					console.log("Channel " + channel.name + " registered.")
					break;
				case 'music':
					chanPFCMusic = channel.id
					client.chanPFCMusic = chanPFCMusic
					console.log("Channel " + channel.name + " registered.")
					break;
				case 'rules':
					chanPFCRules = channel.id
					client.chanPFCRules = chanPFCRules
					console.log("Channel " + channel.name + " registered.")
					break;
				default:		
			}
		}
	})

	client.channels.cache.get(chanBotLog).send('Startup Complete!')

	updaterules(client, chanPFCRules, chanBotLog).then(() => {

	var twitchans = {}
	var numchans = Object.keys(twitterchans).length
	var curchan = 1;

	if (numchans > 1){
		for(const [key, value] of Object.entries(twitterchans)) {
			if (curchan == 1){
				twitchans = 'from:' + value.toString();
				curchan += 1;
			} else {
				twitchans = twitchans + ' OR from:' + value.toString() ;
				curchan += 1;
			}
		};	
	} else { 
		twitchans = Object.values(twitterchans)[0];
	}

		listenForever(() => twitterClient.stream("tweets/search/recent", {
					query: twitchans,
					start_time: new Date(new Date() - 42000).toISOString(),
					end_time: new Date(new Date() - 12000).toISOString(),
					expansions: "author_id"
				}),
			(message) => {
				getusername(() => twitterClient.get("users/" + message[0].author_id, {
				}), (data) => {
					if (data != undefined){
						client.channels.cache.get(chanSCNews).send(
							"**" + data.data.name + "** just tweeted this!\n" +
							"https://twitter.com/"+ data.data.username + "/status/" + message[0].id
							)
					} else {
						console.log('data is undefined')
					}
				})
			}
		);
	});
})

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
const {countForSpam, timeForSpam} = require('./config.json');

setInterval(() => {
	allowmessage = true;
}, timeForSpam);

client.on("messageCreate", function(message, interaction){
    allowmessage = process_messages(message, allowmessage);
	
	if (messagecount == undefined){
		messagecount = {}
	}
	if (isProduction){
		if(messagecount == undefined || !messagecount[message.channel.id]){
			messagecount[message.channel.id] = 1
			setvariable(client, 'messagecount', messagecount)
		} else {
			messagecount[message.channel.id] += 1
			setvariable(client, 'messagecount', messagecount)
		}
	}

	if (messagecount[message.channel.id] >= countForSpam){
		
		if (isDevelopment) {
			client.channels.cache.get(chanBotTest).send(selectRandomMessage(countBasedChatter))
		} else {
			client.channels.cache.get(message.channel.id).send(selectRandomMessage(countBasedChatter))
		
			messagecount[message.channel.id] = 0
			setvariable(client, 'messagecount', messagecount)
		}
	}
	
});

function selectRandomMessage(messageList){

	const keylist = Object.keys(messageList)
	const keylistlen = keylist.length

	const tmp = messageList[keylist[Math.floor(Math.random() * keylistlen)]] 
	return tmp
}

//***********************************************************/
// Here is where we set up the chatter
//***********************************************************/
function sendsomeMessage() {

}

setInterval(sendsomeMessage, 1000)

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