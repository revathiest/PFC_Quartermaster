const { EmbedBuilder } = require('discord.js')
const { dbinfo } = require('../config.json')

module.exports ={
	updaterules: async function(client, chanPFCRules){
		const mysql = require('mysql')
		const database = mysql.createConnection(dbinfo)

		client.channels.cache.get(chanBotLog).send('Updating Rules')

		var embedid
		const rulesEmbed = new EmbedBuilder()

		//initiate the database connection
		database.connect(
			function(err){
				if (err){
					return console.error('Database error: ', err.message)
				}
				console.log('Connected to the MySQL Server')
			}
		)

		database.beginTransaction(function(err) {
			if (err) { console.log (err) }	

			try {
				var querystring = "SELECT * from PFC_BOT_RULES_EMBED"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					embedid = result[0].Embed_id
				})
			} catch (error){
				console.log(error.stack)
			}

			try {
				var querystring = "SELECT * from PFC_RULES"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					
					var rules = result
					var ruletext = `**Before you post, please let us know what brings you to the PFCS Discord. Once you've made your selection, the rest of the server will become available to you!**\r\n`
					ruletext = ruletext + `<:Flame:821839818240557136> Interested in joining the Pyro Freelancer Corps\r\n`
					ruletext = ruletext + `<:StarCitizen:821855258136805456> Interested in hanging out as a visitor or to register for a PFCS Sponsored event\r\n`
					ruletext = ruletext + `:military_medal: Joining as a member of an affiliate organization\r\n\r\n`
					ruletext = ruletext + `**-To gain access to our Recon Patrol Division chat (RP), contact a PFC Officer.**\r\n\r\n`
					ruletext = ruletext + `**Server Rules**\r\n`

					rules.forEach(rule => {
						ruletext = ruletext + "**" + rule.RuleNum + "**. " + rule.RuleText + "\r\n"
					})

					rulesEmbed.setColor('#0099ff')
					rulesEmbed.setTitle('Welcome to the Pyro Freelancer Corps Discord')
					rulesEmbed.setURL('https://discord.js.org/')
					rulesEmbed.setAuthor({name:'Pyro Freelancer Corps', iconURL:'https://i.imgur.com/5sZV5QN.png', url:'https://robertsspaceindustries.com/orgs/PFCS'})
					rulesEmbed.setDescription(ruletext)
					//rulesEmbed.setThumbnail('https://i.imgur.com/RdZBmhk.png')
					rulesEmbed.setTimestamp()
					rulesEmbed.setFooter({text:'Official PFC Communication', iconURL:'https://i.imgur.com/5sZV5QN.png'})

					setmessage(client, embedid, rulesEmbed, chanPFCRules)

				})

			} catch (error){
				console.log(error.stack)
			}
		})
    }
}

async function setmessage(client, embedid, rulesEmbed, ruleschannel){
	const mysql = require('mysql')
	const database = mysql.createConnection(dbinfo)

	var messagetoUpdate
	var newmessageid
	var channel = client.channels.cache.get(ruleschannel)

		try{
			messagetoUpdate = await channel.messages.fetch(embedid)	
			console.log(messagetoUpdate)
			console.log(messagetoUpdate.id)
			messagetoUpdate.edit({embeds: [rulesEmbed]})
			return 'success'
		}catch{
			newmessageid =await client.channels.cache.get(ruleschannel).send({embeds: [rulesEmbed]}).then(embedMessage =>{return embedMessage.id})
		}

		database.connect(
			function(err){
				if (err){
					return console.error('Database error: ', err.message)
				}
				console.log('Connected to the MySQL Server')
			}
		)

		try {
			var querystring = 'DELETE FROM PFC_BOT_RULES_EMBED'
			database.query(querystring, function (err, result, fields) {
				if (err) { console.log(err) }
			})
			querystring = 'INSERT INTO PFC_BOT_RULES_EMBED (Embed_id) VALUES ('+newmessageid+')'
			database.query(querystring, function (err, result, fields) {
				if (err) { console.log(err) }
			})

		} catch (error){
			console.log(error.stack)
		}		
}