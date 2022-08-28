const {SlashCommandBuilder } = require('@discordjs/builders')

module.exports ={
	data: new SlashCommandBuilder()
		.setName('org')
		.setDescription('Retrieves information about an Organization from the Star Citizen API')
		.addStringOption(option => option.setName('name').setDescription('The name of the Organization to look up.').setRequired(true)),

	async execute(interaction, client){
		
		// Star Citizen API URL definitions
		const SCAApiBase = 'https://api.starcitizen-api.com/77210b95720bd50b3584ead32936dfd4/v1/'
		//API Modes
		const SCApiCache = SCAApiBase + 'cache/'
		const SCApiLive = SCAApiBase + 'live/'
		const SCApiAuto = SCAApiBase + 'auto/'
		const SCApiEager = SCAApiBase + 'eager/'
		//API Categories
		const SCApiOrganization = 'organization/'
		//Organization
		const SCApiCacheOrganization = SCApiCache + SCApiOrganization
		const SCApiLiveOrganization = SCApiLive + SCApiOrganization
		
		const fetch = require('node-fetch') // required to call the Star Citizen API
		const { EmbedBuilder } = require ('discord.js') // required to send the embed to Discord
		
		const orgname = interaction.options._hoistedOptions[0].value
		
		var answer = await fetch(SCApiLiveOrganization + orgname).then(response => response.text())
		var org = JSON.parse(answer)
		
		if (org.data == null ){
			if (org.data == null){
				interaction.reply(org.message)
				return
			}
		}
		
		if (org.data != undefined) {
			
			const orgName = org.data.name
			const orgURL = org.data.url
			const orgImg = org.data.banner
			var orgBio = 'This org has no biographical information'
			if (org.data.headline != null && org.data.headline != ''){
				orgBio = org.data.headline.plaintext
			}
			const orgLogo = org.data.logo
			const orgMembers = org.data.members
			
			var orgRecruiting 
			if (org.data.recruiting == true) {
				orgRecruiting = 'Open'
			} else {
				orgRecruiting = 'Closed'
			}
			
			const responseEmbed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(orgName + ' - ' + orgMembers + ' members')
			.setURL(orgURL)
			//.setAuthor(orgOrg, orgOrgImg, 'https://robertsspaceindustries.com/orgs/' + orgOrgSID)
			.setThumbnail(orgLogo)
			.setTimestamp()
			.setFooter({text:'Official PFC Communication', iconURL:'https://i.imgur.com/5sZV5QN.png'})
			.setDescription(orgBio)
			.addFields({name: 'Recruiting Status: ', value:orgRecruiting})
			
			
			interaction.user.send({ embeds: [responseEmbed] })
			interaction.reply({content: 'Check your DMs', ephemeral: true})
		
		} else {
			interaction.reply(SCApiLiveOrganization + orgname)
		}
	}

}