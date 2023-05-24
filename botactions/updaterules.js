const {
    EmbedBuilder
} = require('discord.js');
const {
    bot_type,
    dbinfo
} = require('../config.json');
const mysql = require('mysql');

async function updaterules(client, chanPFCRules, chanBotLog) {
    const database = mysql.createConnection(dbinfo);

    client.channels.cache.get(chanBotLog).send('Updating Rules');

    database.connect((err) => {
        if (err) {
            console.error('Database error:', err.message);
            return;
        }
        console.log('Connected to the MySQL Server');

        database.beginTransaction((err) => {
            if (err) {
                console.log(err);
                return;
            }

            try {
                const query1 = "SELECT * FROM PFC_BOT_RULES_EMBED";
                database.query(query1, (err, result) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    const embedid = result.length > 0 ? result[0].Embed_id : null;

                    const query2 = "SELECT * FROM PFC_RULES";
                    database.query(query2, (err, result) => {
                        if (err) {
                            console.log(err);
                            return;
                        }

                        const rules = result;
                        let ruletext = "**Before you post, please let us know what brings you to the PFCS Discord. Once you've made your selection, the rest of the server will become available to you!**\r\n";
                        ruletext += "<:Flame:821839818240557136> Interested in joining the Pyro Freelancer Corps\r\n";
                        ruletext += "<:StarCitizen:821855258136805456> Interested in hanging out as a visitor or to register for a PFCS Sponsored event\r\n";
                        ruletext += ":military_medal: Joining as a member of an affiliate organization\r\n\r\n";
                        ruletext += "**-To gain access to our Recon Patrol Division chat (RP), contact a PFC Officer.**\r\n\r\n";
                        ruletext += "**Server Rules**\r\n";

                        rules.forEach((rule) => {
                            ruletext += `**${rule.RuleNum}**. ${rule.RuleText}\r\n`;
                        });

                        ruletext += "https://robertsspaceindustries.com/orgs/PFCS \r\n";

                        const rulesEmbed = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle('Welcome to the Pyro Freelancer Corps Discord')
                            .setURL('https://discord.js.org/')
                            .setAuthor({
                            name: 'Pyro Freelancer Corps',
                            iconURL: 'https://i.imgur.com/5sZV5QN.png',
                            url: 'https://robertsspaceindustries.com/orgs/PFCS'
                        })
                            .setDescription(ruletext)
                            .setTimestamp()
                            .setFooter({
                            text: 'Official PFC Communication',
                            iconURL: 'https://i.imgur.com/5sZV5QN.png'
                        });

                        setmessage(client, embedid, rulesEmbed, chanPFCRules, database);
                    });
                });
            } catch (error) {
                console.log(error.stack);
            }
        });
    });
}

async function setmessage(client, embedid, rulesEmbed, ruleschannel, database) {
	let messagetoUpdate;
	let newmessageid;
	let channel;
  
	try {
	  channel = await client.channels.fetch(ruleschannel);
	} catch (error) {
	  console.log('Error fetching channel:', error);
	  return;
	}
  
	if (embedid) {
	  try {
		messagetoUpdate = await channel.messages.fetch({ around: embedid, limit: 1, cache: false });
		const fetchedMessage = messagetoUpdate.first();
		if (fetchedMessage && fetchedMessage.author.id === client.user.id) {
		  await fetchedMessage.edit({ embeds: [rulesEmbed] });
		  console.log("I was able to update the embed");
		  return 'success';
		} else {
		  console.log("Could not update the embed");
		  return 'Cannot edit message from another user';
		}
	  } catch (error) {
		console.log("Could not find the embed");
	  }
	}
  
	if (bot_type === "development") {
	  6console.log("Development bot. Sending new message to test channel.");
	} else {
	  console.log("Production bot. Sending message to " + ruleschannel);
	}
  
	try {
	  const sentMessage = await channel.send({ embeds: [rulesEmbed] });
	  newmessageid = sentMessage.id;
  
	  database.beginTransaction((err) => {
		if (err) {
		  console.log(err);
		  return;
		}
  
		const query1 = 'DELETE FROM PFC_BOT_RULES_EMBED';
		database.query(query1, (err, result) => {
		  if (err) {
			console.log(err);
			database.rollback(() => {
			  console.log('Transaction rolled back due to query error');
			  database.end();
			});
			return;
		  }
  
		  const query2 = `INSERT INTO PFC_BOT_RULES_EMBED (Embed_id) VALUES (${newmessageid})`;
		  database.query(query2, (err, result) => {
			if (err) {
			  console.log(err);
			  database.rollback(() => {
				console.log('Transaction rolled back due to query error');
				database.end();
			  });
			  return;
			}
  
			database.commit((err) => {
			  if (err) {
				console.log(err);
				database.rollback(() => {
				  console.log('Transaction rolled back due to commit error');
				  database.end();
				});
				return;
			  }
			  console.log('Transaction committed');
			  database.end();
			});
		  });
		});
	  });
  
	  return 'success';
	} catch (error) {
	  console.log(error.stack);
	}
  }
  
  module.exports = {
	updaterules
  };