const { SlashCommandBuilder } = require('@discordjs/builders')
const { botPermsReq } = require('./../config.json')
const Builder = new SlashCommandBuilder()

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder	.setName('reset')
Builder.setDescription('Restarts the Quartermaster (Admin only)')

module.exports ={
	data: Builder,

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