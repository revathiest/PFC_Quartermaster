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

		await interaction.user.send({ embeds: [responseEmbed] })
		await interaction.reply({content: 'Check your DMs', ephemeral: true})
	}
}