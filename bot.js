// Require the necessary discord.js classes
const { Discord, Client, GatewayIntentBits, Collection, EmbedBuilder, InteractionType, PermissionFlagsBits } = require('discord.js')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const Twitter = require('twit') // Imports the twitter library
const fs = require('fs') // imports the file io library
const { Player } = require("discord-music-player") // required for music functionality
const { clientId, guildId, token, dbinfo, twitter} = require('./config.json')
const rest = new REST({ version: '9' }).setToken(token)

//PFC Discord Channel Definitions
const chanBotLog = '908482195214172200'
const chanBotTest = '907426072700801094'
const chanSCNews = '818848322734260224'
const chanPFCMusic = '898758865317937162'

// Create a new client instance
const client = new Client({ intents: [
	GatewayIntentBits.Guilds, 
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildVoiceStates
]})

client.chanBotLog = chanBotLog
client.chanBotTest = chanBotTest
client.chanSCNews = chanSCNews
client.chanPFCMusic = chanPFCMusic

//***********************************************************/
//Twitter setup
//***********************************************************/

const twitterClient = new Twitter(twitter)
const {twitterchans} = require('./config.json')

var twitfollow = ''

for(var key in twitterchans){
	if (twitterchans.hasOwnProperty(key)){
		if (twitfollow == ''){
			twitfollow = twitterchans[key]
		} else {
			twitfollow += ',' + twitterchans[key]
		}
	}
}

// Create a stream to follow tweets
const stream = twitterClient.stream('statuses/filter', {
	follow: twitfollow
})

client.stream = stream

stream
	.on('error', (error) => {
		client.channels.cache.get(chanBotLog).send('Error: (twitter)' + error.stack)
	})
	.on('tweet', tweet => {
	const twitterMessage = '**'+tweet.user.name + '** just tweeted this!\n https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str
	
	//Making sure that the bot has access to the News channel.  We dont want the dev bot posting there.
	var botHasAccess = client.channels.cache.get(chanSCNews).permissionsFor(clientId).has(PermissionFlagsBits.ViewChannel)

	if (tweet.retweeted_status
    || tweet.in_reply_to_status_id
    || tweet.in_reply_to_status_id_str
    || tweet.in_reply_to_user_id
    || tweet.in_reply_to_user_id_str
    || tweet.in_reply_to_screen_name) {
		return
	} else {
		
		if (botHasAccess){
			client.channels.cache.get(chanSCNews).send(twitterMessage)
		} else {
			client.channels.cache.get(chanBotLog).send(twitterMessage)
		}
	}
	return false
	})

//***********************************************************/
//Music Player Setup
//***********************************************************/

const player = new Player(client, {
    leaveOnEmpty: true,
	leaveOnStop: false,
	leaveOnEnd: false// This options are optional.
})

client.player = player

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
    })


//***********************************************************/
//Client Setup
//***********************************************************/
client
	.once('ready', () => { 
		client.channels.cache.get(chanBotLog).send('Startup completed!')
	})

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
	.setFooter({text:'Official PFC Communication', iconURL:'https://i.imgur.com/5sZV5QN.png'})

interaction.reply({ embeds: [responseEmbed] })
}

//This creates the commands so that they can be run.
client.commands = new Collection()
var cmdsToRegister = []
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
const playercommandFiles = fs.readdirSync('./commands/musiccommands').filter(file => file.endsWith('.js'))

console.log('====Registering Star Citizen Commands: ')
for (const file of commandFiles) {
	const command = require('./commands/' + file)
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	try{
		client.commands.set(command.data.name, command)
		cmdsToRegister.push(command.data.toJSON())
		console.log('Registered command ' + command.data.name)
	} catch (error) {
		console.error(error)
	}
}

console.log('====Registering Music Commands: ')
for (const file of playercommandFiles) {
	const command = require('./commands/musiccommands/' + file)
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	try{
		client.commands.set(command.data.name, command)
		cmdsToRegister.push(command.data.toJSON())
		console.log('Registered command ' + command.data.name)
	} catch (error) {
		console.error(error)
	}
}

(async () => {
	try {
		console.log('Started refreshing application (/) commands.')

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: cmdsToRegister },
		)

		console.log('Successfully reloaded application (/) commands.')
	} catch (error) {
		console.error(error)
	}
})()

client.on('interactionCreate', async interaction => {
	
	var roles = interaction.member._roles
	var command = client.commands.get(interaction.commandName)

	if (interaction.type === InteractionType.ApplicationCommand) {
		
		var message = interaction.user.username + ' used command **' + interaction.commandName + '**'
		if (interaction.options._hoistedOptions[0] != undefined){
			message = message + ' with options **' +interaction.options._hoistedOptions[0].value + '**'
		}
		client.channels.cache.get(chanBotLog).send(message)
		
		
		if (command.role != undefined){
			if (!roles.includes(command.role)){
				interaction.reply("You're not authorized to use that command")
				return
			}
		}
		
		if (!command) {
			interaction.reply('Unable to find command...')
			return
		}
		
		try {
			if (typeof command.execute === 'function'){
				await command.execute(interaction, client);
			} else {
				command(interaction)
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

client.on('error', (error) => {
		client.channels.cache.get(chanBotLog).send('Error: (client)' + error.stack)
	})

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!')
})

// Login to Discord with your client's token
client.login(token)





