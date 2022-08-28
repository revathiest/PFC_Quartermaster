// Require the necessary discord.js classes
const { Discord, Client, GatewayIntentBits, Collection, EmbedBuilder, InteractionType } = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const { clientId, guildId, token } = require('./config.json')
const Twitter = require('twit') // Imports the twitter library
const fs = require('fs') // imports the file io library
const mysql = require('mysql') // required to connect to database
const { Player } = require("discord-music-player") // required for music functionality
const rest = new REST({ version: '9' }).setToken(token)

// Create a new client instance
const client = new Client({ intents: [
	GatewayIntentBits.Guilds, 
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildVoiceStates
]})

const twitterConf = {
	consumer_key: 'cHI1u2L9rk8MqHjWEmiUlYkWU',
	consumer_secret: 'm2WiHuKvv2c6s7uGMfMGHStZkcbj3Lh2RrUaOrRaPjKygLpM94',
    access_token: '40008264-4ie8l0mCO93xMVrvJdlvpBdswf2cRFhND0kRpA3Qf',
    access_token_secret: 'dQbf8LxEGitTHmxnJ1cLmjwOfYeCw10VsAZZluHJhSXYX'
	}

const twitterClient = new Twitter(twitterConf)

const player = new Player(client, {
    leaveOnEmpty: true,
	leaveOnStop: false,
	leaveOnEnd: false// This options are optional.
})

//Twitter users who can be followed
const robertsspaceind = '803542770' // @RobertsSpaceInd
const every3minutes = '2899773086' // @Every3Minutes
const alltheminutes = '2871186250' // @alltheminutes
const bigbenclock = '86391789' //@beg_ben_clock
const revathiest = '40008264' //@revathiest


// Create a stream to follow tweets
const stream = twitterClient.stream('statuses/filter', {
	follow: [
		robertsspaceind, 
		revathiest
	].join(',')
})

const fetch = require('node-fetch') // required to call the Star Citizen API
const success = true
const failed = false
// Star Citizen API URL definitions
const SCAApiBase = 'https://api.starcitizen-api.com/77210b95720bd50b3584ead32936dfd4/v1/'
//API Modes
const SCApiCache = SCAApiBase + 'cache/'
const SCApiLive = SCAApiBase + 'live/'
const SCApiAuto = SCAApiBase + 'auto/'
const SCApiEager = SCAApiBase + 'eager/'
//API Categoris
const SCApiUser = 'user/'
const SCApiOrgMem = 'organization_members/'
const SCApiOrganization = 'organization/'
//Users
const SCApiCacheUser = SCApiCache + SCApiUser
const SCApiLiveUser = SCApiLive + SCApiUser
const SCApiAutoUser = SCApiAuto + SCApiUser
const SCApiEagerUser = SCApiEager + SCApiUser
//Organization Members
const SCApiCacheOrgMembers = SCApiCache + SCApiOrgMem
const SCApiLiveOrgMembers = SCApiLive + SCApiOrgMem
const SCApiAutoOrgMembers = SCApiAuto + SCApiOrgMem
const SCApiEagerOrgMembers = SCApiEager + SCApiOrgMem
//Organization
const SCApiCacheOrganization = SCApiCache + SCApiOrganization
const SCApiLiveOrganization = SCApiLive + SCApiOrganization
//PFC Discord Rank Definitions
const roleAdmin = '849044491343757343'
const roleEnsign = '818693870811873310'
const roleLieutenant = '818693786276069416'
const roleCommander = '818693674640080960'
const roleCaptain = '818693518271840286'
const roleAdmiral = '818693289930522665'
const roleFltAdmiral = '818668219551842344'
const roleRecruit = '833440108647677953'
const roleWreckRaiders = '835723606905454664'
const roleAffiliate = '833415056783441931'
const roleStowaway = '823083914116595743'
//PFC Discord Channel Definitions
const chanBotLog = '908482195214172200'
const chanBotTest = '907426072700801094'
const chanSCNews = '818848322734260224'
const chanPFCMusic = '898758865317937162'
//Server Definitions
const guildPFC = '818666637858177046'

//Console listener
const pebble = process.stdin
pebble.addListener("data", result => {
	
	const text = result.toString().trim().split(/ +/g)

	switch (text[0]){
		case 'run':
			try{
				client.commands.get(text[1]).execute()
			} catch (error) {
				console.log(error)
			}
		case 'say':
			break;
		default:
	}	
	
	
	if (text == 'webupdate'){
		client.commands.get('webupdate').execute()
	}

})



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
    .on('queueDestroyed',  (queue) =>
        client.channels.cache.get(chanPFCMusic).send('The queue was destroyed.'))
    // Emitted when the queue was destroyed (either by ending or stopping).    
    .on('queueEnd',  (queue) =>
        client.channels.cache.get(chanPFCMusic).send('The queue has ended.'))
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
	.on('queueCleared', (queue) =>
		client.channels.cache.get(chanPFCMusic).send('Queue was cleared.'))
    .on('error', (error, queue) => {
        client.channels.cache.get(chanBotLog).send('Error: (music)' + error.message)
    })

// With luck, this will keep twitter from killing the bot.
stream
	.on('error', (error) => {
		client.channels.cache.get(chanBotLog).send('Error: (twitter)' + error.message)
	})
	.on('tweet', tweet => {
	const twitterMessage = '**'+tweet.user.name + '** just tweeted this!\n https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str
	
	if (tweet.retweeted_status
    || tweet.in_reply_to_status_id
    || tweet.in_reply_to_status_id_str
    || tweet.in_reply_to_user_id
    || tweet.in_reply_to_user_id_str
    || tweet.in_reply_to_screen_name) {
		// client.channels.cache.get(chanBotLog).send('Blocked the following tweet from ' + tweet.user.name)
		// client.channels.cache.get(chanBotLog).send('https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str)
		return
	} else {
		client.channels.cache.get(chanSCNews).send(twitterMessage)
	}
	return false
	})

client.once('ready', () => { // prints "Ready!" to the console once the bot is online
	client.channels.cache.get(chanBotLog).send('Startup completed!')
})

//============================================================================
// getDatabase() - Creates the database object
// 20211108 krh Initial Coding
//============================================================================
function dbOpen(){
	const database = mysql.createConnection({
	host: 'na05-sql.pebblehost.com',
	user: 'customer_230193_pfc',
	password: 'oZmTmYJ4l5!si1gbCNs@',
	database: 'customer_230193_pfc',
	})

	database.connect(
		function(err){
			if (err){
				return console.error('Database error: ', err.stack)
			}
			client.channels.cache.get(chanBotLog).send('Connected to the MySQL Server')
		}
	)
	return database
}

//============================================================================
// dbClose(db) - Closes the database object
// 20211108 krh Initial Coding
//============================================================================
function dbClose(db){
		db.end(
		function(err){
			if (err){
				return console.error('Database error: ', err.stack)
			}
			client.channels.cache.get(chanBotLog).send('Connection to the MySQL Server ended')
		}
	)
}



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


//============================================================================
// This a test function to send a message to a specific channel
// 20211108 krh Initial Coding
//============================================================================
function channelLog(logMessage){

	client.channels.cache.get(chanBotLog).send(logMessage)

}

//============================================================================
// This a test function to the rank of a user
// 20211108 krh Initial Coding
//============================================================================
async function rank(message){
	try {
		const thisrole = await message.guild.roles.fetch(roleStowaway)
		const member = await message.mentions.members.first()

		member.roles.add(thisrole).then(client.channels.cache.get(chanBotLog).send("success"))
		
	} catch(err) {
		client.channels.cache.get(chanBotLog).send(err)	
	}
}

//============================================================================818666637858177046
// This is the Command List.  To add new commands, simply add a new commands.set()
// 20211108 krh Initial Coding
//============================================================================
async function getRole(rank){
	
	switch (rank){
		case 'Recruit':
			return roleRecruit
			break
		case 'Ensign':
			return roleEnsign
			break
		case 'Lieutenant':
			return roleLieutenant
			break
		case 'Commander':
			return roleCommander
			break
		case 'Captain':
			return roleCaptain
			break
		case 'Admiral':
			return roleAdmiral
			break
		case 'Fleet Admiral':
			return roleFltAdmiral
			break
		case 'Wreck Raiders':
			return roleWreckRaiders
			break
		case 'Affilliate':
			return roleAffiliate
			break
		default:
			return roleStowaway
	}
}


//============================================================================
// getRSIUser - This command will return the user json from RSI
// 20211108 krh Initial Coding
//============================================================================
async function updateRSIUser(item){
	
	const RSIname = item.handle
	var Discname = null
	
	try {
		var server = await client.guilds.fetch(guildPFC)
		server.members.fetch().then(members => {
			members.forEach(member => {
				if (RSIname == member.user.username){
					Discname = member.user.username
					if (Discname != null) {
						addRecord(RSIname, Discname)
					}
				}
			})
		})

	} catch (error) {
		client.channels.cache.get(chanBotLog).send(error)
	}
}


//============================================================================
// syncRSIUser - This command will update the user mapping in the database 
// 20211108 krh Initial Coding
//============================================================================
async function mapRSIUsers(OrgName){
	
	const name = OrgName.toString()
	
	var ret = await fetch(SCApiCacheOrgMembers + name).then(response => response.text())
	var OrgMembers = JSON.parse(ret)
	if (OrgMembers.data == null) {
		ret = await fetch(SCApiLiveOrgMembers + name).then(response => response.text())
		OrgMembers = JSON.parse(ret)
		client.channels.cache.get(chanBotLog).send('Data was null')
	} 
	
	if (OrgMembers.data == undefined || OrgMembers.data == []) {
		client.channels.cache.get(chanBotLog).send('Data was undefined')
		return failed
	}
	
	OrgMembers.data.forEach(element => {
		updateRSIUser(element)
		// const RSIname = member.handle
		// const DiscName = client.user.fetch(RSIname)
		// client.channels.cache.get(chanBotLog).send(RSIname + ' maps to ' + DiscName)
	})

}

function addRecord(RSI_name, Disc_name){

	const db = dbOpen()

		db.beginTransaction(function(err) {
		if (err) { throw err }
		
		const querystring = "INSERT INTO mapUserMember SET RSI_Username='" + RSI_name + "', Discord_Username='" + Disc_name + "'"
		db.query(querystring)
		db.commit()
		dbClose(db)
	})
	
}

//============================================================================
// memlist(message) This shows a list of users in the server
// 20211114 krh Initial Coding
//============================================================================
async function memlist(message){
	const guild = await client.guilds.fetch(guildPFC)
	guild.members.fetch().then(members => {
		members.forEach(member => client.channels.cache.get(chanBotLog).send(member.user.username))
	})

}

//============================================================================
// This is the music bot section
// 20211114 krh Initial Coding
//============================================================================
async function play(interaction){
	const args = interaction.options._hoistedOptions[0].value
	if (interaction.channel.id == chanPFCMusic || interaction.channel.id == chanBotTest) {
		let guildQueue = player.getQueue(interaction.guild.id)
		let queue = player.createQueue(interaction.guild.id)
		try{
			await queue.join(interaction.member.voice.channel)
			interaction.reply({content: 'Adding your song to the queue', ephemeral: false})
		} catch (error) {
			interaction.reply("It doesn't look like you're in a voice channel that I can join.")
		}
		let song = await queue.play(args).catch(error => {
			console.log(error)				
			if(!guildQueue)
				queue.stop()
		})
	} else {
		interaction.reply({content: 'I only accept that command in #music', ephemeral: true})
	}
		
}

async function playlist(interaction){
	const args = interaction.options._hoistedOptions[0].value
	if (interaction.channel.id == chanPFCMusic || interaction.channel.id == chanBotTest) {
		let guildQueue = player.getQueue(interaction.guild.id)
		let queue = player.createQueue(interaction.guild.id)
		try{
			await queue.join(interaction.member.voice.channel)
			interaction.reply({content: 'Adding your playlist to the queue', ephemeral: false})
		} catch (error) {
			interaction.reply("It doesn't look like you're in a voice channel that I can join.")
		}
		let song = await queue.playlist(args).catch(error => {
			console.log(error)
			if(!guildQueue)
				queue.stop()
		})
	} else {
		interaction.reply('I only accept that command in #music')
	}
}

async function shuffle(interaction) {
	if (interaction.channel.id == chanPFCMusic || interaction.channel.id == chanBotTest) {
		let guildQueue = player.getQueue(interaction.guild.id)
		if (guildQueue == undefined){
			interaction.reply('There is queue to shuffle right now.')
		} else {
			try{
				guildQueue.shuffle()
			} catch (error) {
				client.channels.cache.get(chanBotLog).send (error)
			}
		interaction.reply({content: 'Now shuffling the playlist', ephemeral: false})
		}
	} else {
		interaction.reply('I only accept that command in #music')
	}
}

async function skip(interaction) {
	if (interaction.channel.id == chanPFCMusic || interaction.channel.id == chanBotTest) {
		let guildQueue = player.getQueue(interaction.guild.id)
		if (guildQueue == undefined){
			interaction.reply('There is no song playing right now.')
		} else {
			try{
				guildQueue.skip()
			} catch (error) {
				client.channels.cache.get(chanBotLog).send (error)
			}
		interaction.reply({content: 'Song Skipped', ephemeral: false})
		}
	} else {
		interaction.reply('I only accept that command in #music')
	}
}
async function stop(interaction) {
	if (interaction.channel.id == chanPFCMusic || interaction.channel.id == chanBotTest) {
		let guildQueue = player.getQueue(interaction.guild.id)
		if (guildQueue == undefined){
			interaction.reply('There is no song playing right now.')
		} else {
			try{
				guildQueue.stop()
			} catch (error) {
				client.channels.cache.get(chanBotLog).send(error)
			}
		interaction.reply({content: 'Queue Destroyed', ephemeral: false})
		}
	} else {
		interaction.reply('I only accept that command in #music')
	}
}
async function pause(interaction) {
	if (interaction.channel.id == chanPFCMusic || interaction.channel.id == chanBotTest) {
		let guildQueue = player.getQueue(interaction.guild.id)
		if (guildQueue == undefined){
			interaction.reply('There is no song playing right now.')
		} else {
			try{
				guildQueue.setPaused(true)
			} catch (error) {
				client.channels.cache.get(chanBotLog).send (error)
			}
		interaction.reply({content: 'Music paused', ephemeral: false})
		}
	} else {
		interaction.reply('I only accept that command in #music')
	}
}
async function resume(interaction) {
	if (interaction.channel.id == chanPFCMusic || interaction.channel.id == chanBotTest) {
		let guildQueue = player.getQueue(interaction.guild.id)
		if (guildQueue == undefined){
			interaction.reply('There is no paused song.')
		} else {
			try{
				guildQueue.setPaused(false)
			} catch (error) {
				client.channels.cache.get(chanBotLog).send (error)
			}
		interaction.reply({content: 'Music resumed', ephemeral: false})
		}
	} else {
		interaction.reply('I only accept that command in #music')
	}
}
async function clear(interaction) {
	if (interaction.channel.id == chanPFCMusic || interaction.channel.id == chanBotTest) {
		let guildQueue = player.getQueue(interaction.guild.id)
		if (guildQueue == undefined){
			interaction.reply({content: 'There is currently no queue.', ephemeral: true})
		} else {
			try{
				guildQueue.clearQueue()
			} catch (error) {
				client.channels.cache.get(chanBotLog).send (error)
			}
		interaction.reply({content: 'Queue cleared', ephemeral: false})
		}
	} else {
		interaction.reply('I only accept that command in #music')
	}
}
async function queue(interaction) {
	if (interaction.channel.id == chanPFCMusic || interaction.channel.id == chanBotTest) {
		let guildQueue = player.getQueue(interaction.guild.id)
		if (guildQueue == undefined){
			interaction.reply({content: 'The queue is empty', ephemeral: true})
			return
		}
		songs = guildQueue.songs
		if (songs.length <= 10){
			songs.forEach(song => {
				client.channels.cache.get(chanPFCMusic).send(song.name)
			})
			interaction.reply({content: 'Done', ephemeral: true})
		} else {
			client.channels.cache.get(chanPFCMusic).send(interaction.user.username + ' requested the queue')
			interaction.reply({content:"Its a long list.  I'll send it to your DMs.", ephemeral: true})
			songs.forEach(song => { 
			interaction.user.send(song.name)
			})
			interaction.editReply({content: 'Check your DMs', ephemeral: true})
		}
	} else {
		interaction.reply('I only accept that command in #music')
	}

}
async function playing(interaction) {
	if (interaction.channel.id == chanPFCMusic || interaction.channel.id == chanBotTest) {
		let guildQueue = player.getQueue(interaction.guild.id)
		if (guildQueue == undefined){
			interaction.reply('There is no song playing right now.')
		} else {
			try{
				interaction.reply('Now Playing: ' + guildQueue.nowPlaying)
			} catch (error) {
				client.channels.cache.get(chanBotLog).send(error)
			}
		}
	} else {
		interaction.reply('I only accept that command in #music')
	}
}

//This creates the commands so that they can be run.
client.commands = new Collection()
var cmdsToRegister = []
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

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

client.commands.set('play', play)
cmdsToRegister.push({
	name: 'play', 
	description: 'Song or link to add to the queue', 
	options: [{
		type: 3,
		name: 'song',
		description: 'Song or link to add to the queue',
		required: true
	}], 
	default_permissions: undefined})
	
client.commands.set('playlist', playlist)
cmdsToRegister.push({
	name: 'playlist', 
	description: 'Playlist to add to the queue', 
	options: [{
		type: 3,
		name: 'playlist',
		description: 'playlist to add to the queue',
		required: true
	}], 
	default_permissions: undefined})
	
client.commands.set('shuffle', shuffle)
cmdsToRegister.push({
	name: 'shuffle', 
	description: 'Play the queue in a random order', 
	options: [], 
	default_permissions: undefined})
	
client.commands.set('skip', skip)
cmdsToRegister.push({
	name: 'skip', 
	description: 'Skip the current song', 
	options: [], 
	default_permissions: undefined})
	
client.commands.set('stop', stop)
cmdsToRegister.push({
	name: 'stop', description: 'Stop the music and destroy the queue', 
	options: [], 
	default_permissions: undefined})
	
client.commands.set('pause', pause)
cmdsToRegister.push({
	name: 'pause', description: 'Pause the music (it can be resumed later)', 
	options: [], 
	default_permissions: undefined})
	
client.commands.set('resume', resume)
cmdsToRegister.push({
	name: 'resume', 
	description: 'Resume the music after it has been paused', 
	options: [], 
	default_permissions: undefined})
	
client.commands.set('clear', clear)
cmdsToRegister.push({
	name: 'clear', 
	description: 'Clear all songs from the pending queue', 
	options: [], 
	default_permissions: undefined})
	
client.commands.set('queue', queue)
cmdsToRegister.push({
	name: 'queue', 
	description: 'Show the current queue', 
	options: [], 
	default_permissions: undefined})
	
client.commands.set('playing', playing)
cmdsToRegister.push({
	name: 'playing', 
	description: 'Show the song that is currently playing', 
	options: [], 
	default_permissions: undefined});

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





