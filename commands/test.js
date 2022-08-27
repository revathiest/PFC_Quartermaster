const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports ={
	data: new SlashCommandBuilder()
	.setName('test')
	.setDescription('A test command for testing discord.js features'),

	async execute(interaction, client){
		
		console.log('test')

	}
}