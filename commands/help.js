const { SlashCommandBuilder } = require('@discordjs/builders')
const { botPermsReq } = require('./../config.json')
const Builder = new SlashCommandBuilder()

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder.setName('help')
Builder.setDescription('Sends Help information to the user')

module.exports ={
	data: Builder,

	//============================================================================
	// 20211109 krh Initial Coding
	// 20211112 krh Moved function to it's own file
	//============================================================================

	async execute(interaction, client){
		
		const { EmbedBuilder } = require ('discord.js')
			
		const responseEmbed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('PFC Quartermaster Help')
			.addFields({name: 'help', value: 'Returns this help information.'})
			.addFields({name: 'user <username>', value: 'Returns information about that user from the RSI website.'})
			.addFields({name: 'org <tag>', value: 'Returns information about an Organization from the RSI website.'})
			.addFields({name: 'ship <shipname>', value: 'Returns information about a ship from the RSI website.  If multiple ships are found, only the first will be displayed.'})
			.addFields({name: 'shipshop <tag (optional)>', value: 'Returns information about Ship Shops and their inventory.'})
			.addFields({name: 'play <song>', value: 'Adds the song to the music queue.'})
			.addFields({name: 'playlist <playlist>', value: 'Adds the playlist to the music queue.'})
			.addFields({name: 'skip', value: 'Skips the song that is currently playing.'})
			.addFields({name: 'stop', value: 'Stops the current song and destroys the queue.'})
			.addFields({name: 'pause', value: 'Pauses the currently playing song.'})
			.addFields({name: 'resume', value: 'Continues a song that has been paused.'})
			.addFields({name: 'clear',value:  'Clears the current music queue.'})
			.addFields({name: 'playing', value: 'Returns the currently playing song.'})

		await interaction.user.send({ embeds: [responseEmbed] })
		await interaction.reply({content: 'Check your DMs', ephemeral: true})
	}
}