const { EmbedBuilder } = require('discord.js')
const { bot_type, dbinfo } = require('../config.json')

module.exports ={
	updaterules: async function(client, chanPFCRules, chanBotLog){
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
					if (result.length == 0) {
						embedid = null
					} else {
						embedid = result[0].Embed_id
					}
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

					ruletext = ruletext + "https://robertsspaceindustries.com/orgs/PFCS \r\n"

					rulesEmbed.setColor('#0099ff')
					rulesEmbed.setTitle('Welcome to the Pyro Freelancer Corps Discord')
					rulesEmbed.setURL('https://discord.js.org/')
					rulesEmbed.setAuthor({name:'Pyro Freelancer Corps', iconURL:'https://i.imgur.com/5sZV5QN.png', url:'https://robertsspaceindustries.com/orgs/PFCS'})
					rulesEmbed.setDescription(ruletext)
					rulesEmbed.setTimestamp()
					rulesEmbed.setFooter({text:'Official PFC Communication', iconURL:'https://i.imgur.com/5sZV5QN.png'})

					setmessage(client, embedid, rulesEmbed, chanPFCRules, chanBotLog)

				})

			} catch (error){
				console.log(error.stack)
			}
		})
    }
}

async function setmessage(client, embedid, rulesEmbed, ruleschannel, chanBotLog) {
	const mysql = require('mysql');
	const database = mysql.createConnection(dbinfo);
  
	var messagetoUpdate;
	var newmessageid;
  
	var channel = client.channels.cache.get(ruleschannel);
	var botChan = client.channels.cache.get(chanBotLog);
	var rulesChan = client.channels.cache.get(ruleschannel);
  
	channel.messages.fetch(embedid)
	  .then((fetchedMessage) => {
		messagetoUpdate = fetchedMessage;
		if (messagetoUpdate && messagetoUpdate.author.id == client.user.id) {
		  return messagetoUpdate.edit({ embeds: [rulesEmbed] });
		} else {
		  console.log("Unable to edit message from another user");
		  return Promise.reject('Cannot edit message from another user');
		}
	  })
	  .then(() => {
		console.log("Successfully updated Rules Embed");
	  })
	  .catch((err) => {
		console.log(err.message);
		if (bot_type == "development") {
		  console.log("Development bot. Sending new message to " + rulesChan.name + ".");
		  return rulesChan.send({ embeds: [rulesEmbed] });
		} else {
		  console.log("Sending Embed to " + rulesChan.name + ".");
		  return rulesChan.send({ embeds: [rulesEmbed] });
		}
	  })
	  .then((embedMessage) => {
		newmessageid = embedMessage.id;
		console.log("New message sent with ID: " + newmessageid);
  
		database.connect(function (err) {
		  if (err) {
			return console.error('Database error: ', err.message);
		  }
		  console.log('Connected to the MySQL Server');
  
		  var querystring = 'DELETE FROM PFC_BOT_RULES_EMBED';
		  database.query(querystring, function (err, result, fields) {
			if (err) {
			  console.log(err);
			} else {
			  console.log("Deleted Embed Id from Database");
			}
		  });
  
		  querystring = 'INSERT INTO PFC_BOT_RULES_EMBED (Embed_id) VALUES (' + newmessageid + ')';
		  database.query(querystring, function (err, result, fields) {
			if (err) {
			  console.log(err);
			} else {
			  console.log("Inserted Embed Id into Database");
			}
		  });
		});
	  })
	  .catch((err) => {
		console.log(err.message);
		// Handle any errors occurred during the asynchronous operations
	  });
  }
  
  