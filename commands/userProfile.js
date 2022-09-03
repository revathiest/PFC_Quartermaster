module.exports ={
	data: {
		"type":2,
		"name":"Get RSI Profile"
	},

	async execute(interaction){
		
		// Star Citizen API URL definitions
		const SCAApiBase = 'https://api.starcitizen-api.com/77210b95720bd50b3584ead32936dfd4/v1/'
		//API Modes
		const SCApiCache = SCAApiBase + 'cache/'
		const SCApiLive = SCAApiBase + 'live/'
		const SCApiAuto = SCAApiBase + 'auto/'
		const SCApiEager = SCAApiBase + 'eager/'
		//API Categories
		const SCApiUser = 'user/'
		//Users
		const SCApiCacheUser = SCApiCache + SCApiUser
		const SCApiLiveUser = SCApiLive + SCApiUser
		const SCApiAutoUser = SCApiAuto + SCApiUser
		const SCApiEagerUser = SCApiEager + SCApiUser
		
		const fetch = require('node-fetch') // required to call the Star Citizen API
		const { EmbedBuilder } = require ('discord.js') // required to send the embed to Discord
		
		var temp

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
				interaction.reply({content: user.message, ephemeral: true})
				return
			}
		}
		
		if (user.data.profile != undefined) {
			
			const userName = user.data.profile.display
			const userURL = user.data.profile.page.url
			const userImg = user.data.profile.image
			var userBio = 'This user has no biographical information'
			if (user.data.profile.bio != null && user.data.profile.bio != ''){
				userBio = user.data.profile.bio
			}
			var userOrg = 'Organization Redacted'
			if (user.data.organization.name != null && user.data.organization.name != ''){
				userOrg = user.data.organization.name
			}
			var userOrgRank = 'Rank Unknown'
			if (user.data.organization.rank != null && user.data.organization.rank != ''){
				userOrgRank = user.data.organization.rank
			}
			const userOrgImg = user.data.organization.image
			const userOrgSID = user.data.organization.sid
			var affOrg = 'Organization Redacted'
			var affOrgRank = 'Rank Unknown'
			var affOrgImg = null
			var affOrgSID = null
				
			
			
			const responseEmbed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(userOrgRank + ' - ' + userName)
			.setURL(userURL)
			.setAuthor({name: userOrg, iconURL:userOrgImg, url:'https://robertsspaceindustries.com/orgs/' + userOrgSID})
			.setThumbnail(userImg)
			.setTimestamp()
			.setFooter({text:'Official PFC Communication', iconURL:'https://i.imgur.com/5sZV5QN.png'})
			
			if (user.data.profile.website != undefined) {
				userBio = userBio + '\n' + user.data.profile.website
			}
			
			responseEmbed.setDescription(userBio)
			
			
			if (user.data.affiliation != null && user.data.affiliation != '') {
				
				const affil = user.data.affiliation
				var afflist = null
				
				affil.forEach(aff => {
					if (aff.name == null || aff.name == '') {
						aff.name = 'Redacted'
						aff.rank = 'Unknown'
					}
					if (afflist == null){
						afflist = aff.name + ' - ' + aff.rank
					} else {
						afflist =  afflist + '\n' + aff.name + ' - ' + aff.rank
					}
				})
				
				responseEmbed.addFields({name: 'Organization Affiliations', value:afflist})
			
			}
			
			interaction.user.send({ embeds: [responseEmbed] })
			interaction.reply({content: 'Check your DMs', ephemeral: true})
		
		} else {
			interaction.reply('RSI doesnt recognize that user.')
		}
	}

}