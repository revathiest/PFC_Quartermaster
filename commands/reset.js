const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports ={
	data: new SlashCommandBuilder()
	.setName('reset')
	.setDescription('Restarts the Quartermaster (Admin only)'),

	async execute(interaction, client){
	
	const { GuildMember } = require ('discord.js')
	const member = interaction.member
	
	if ( member.permissions.has('ADMINISTRATOR') ){
			interaction.reply('Resetting...')
			.then(client.destroy())
		} else {
			interaction.reply('Only an administrator can do that.  Your attempt has been logged.')
		}
	}
}