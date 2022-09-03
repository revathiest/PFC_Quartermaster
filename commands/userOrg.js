const { botPermsReq } = require('../config.json')

module.exports ={
	data: {
		"type":2,
		"name":"Get RSI Org",
		"default_member_permissions":botPermsReq
	},

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
		const SCApiUser = 'user/'
		//Organization
		const SCApiCacheOrganization = SCApiCache + SCApiOrganization
		const SCApiLiveOrganization = SCApiLive + SCApiOrganization
		const SCApiEagerUser = SCApiEager + SCApiUser
		
		const fetch = require('node-fetch') // required to call the Star Citizen API
		const { EmbedBuilder } = require ('discord.js') // required to send the embed to Discord

		var temp

		await interaction.deferReply();

		if (!interaction.targetMember.nickname){
			temp = interaction.targetUser.username.split(" ")
		} else {
			temp = interaction.targetMember.nickname.split(" ")
		}
		var username = temp[temp.length - 1]	
		
		var answer = await fetch(SCApiEagerUser + username).then(response => response.text())
		var user = JSON.parse(answer)
		
		if (user.data == null ){
			if (user.data == null){
				interaction.editReply({content: user.message, ephemeral: true})
				return
			}
		}

		var userOrgSID = null

		if (user.data.profile != undefined) {
			userOrgSID = user.data.organization.sid
		}

		answer = await fetch(SCApiLiveOrganization + userOrgSID).then(response => response.text())
		var org = JSON.parse(answer)
		
		if (org.data == null ){
			if (org.data == null){
				interaction.editReply(org.message)
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
			interaction.editReply({content: 'Check your DMs', ephemeral: true})
		
		} else {
			interaction.editReply(SCApiLiveOrganization + orgname)
		}
	}

}