const { EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, SlashCommandBuilder } = require ('discord.js') // required to send the embed to Discord
const fetch = require('node-fetch') // required to call the Star Citizen API
const { botPermsReq, dbinfo } = require('./../config.json')
const mysql = require('mysql')
const Builder = new SlashCommandBuilder()
var ship

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder	.setName('ship')
Builder.setDescription('Get information about a Ship')
Builder.addStringOption(option => option.setName('name').setDescription('The name of the ship to look up.').setRequired(true)),

module.exports = {
	data: Builder,

	async execute(interaction, client){
		
		if (interaction.replied){
			console.log('replied')
		}		
		if (interaction.deferred){
			console.log('deferred')
		}

		const shipname = interaction.options._hoistedOptions[0].value
		
		// Star Citizen API URL 
		const SCAApi = 'https://api.starcitizen-api.com/77210b95720bd50b3584ead32936dfd4/v1/eager/ships?name='


		
		if (shipname == '' || shipname == undefined){
			if (interaction.replied || interaction.deferred){
				interaction.editReply({content: 'Which ship do you want me to find?', ephemeral: true})
			} else {
				interaction.reply({content: 'Which ship do you want me to find?', ephemeral: true})
			}
			return
		}
		
		if (interaction.replied || interaction.deferred){
			interaction.editReply({content: 'Let me think about that...', ephemeral: true})
		} else {
			interaction.reply({content: 'Let me think about that...', ephemeral: true})
		}
		
		var answer = await fetch(SCAApi + shipname).then(response => response.text())
		ship = JSON.parse(answer)	

			if (ship.data[0] == undefined ){
			if (interaction.replied || interaction.deferred){
				interaction.editReply({content: 'I cant find that ship', ephemeral: true})
			} else {
				interaction.reply({content: 'I cant find that ship', ephemeral: true})
			}
			return
		}
		if (ship.data[0].name != undefined) {
			
			if (ship.data.length > 1) {
				
				const row = new ActionRowBuilder()
				var options = new SelectMenuBuilder()
					.setCustomId('selectShip')
					.setPlaceholder('Please select a ship')
				var count = 0
				
				while (ship.data[count] != undefined){
					
					options.addOptions([
					{
						label: ship.data[count].name,
						value: count.toString()
					}])
					count++
				}
				
				row.addComponents(
					options
				)
				if (interaction.replied || interaction.deferred){
					interaction.editReply({content: "I've found more than one ship that meets that filter.  Which one do you want?", components: [row]})
				} else {
					interaction.reply({content: "I've found more than one ship that meets that filter.  Which one do you want?", components: [row]})
				}
			
			} else {
		
				this.option(interaction, client)
				
			}
			
		} else {
			if (interaction.replied || interaction.deferred){
				interaction.editReply({content: 'That ship does not exist.', ephemeral: true})
			} else {
				interaction.reply({content: 'That ship does not exist.', ephemeral: true})
			}
		}
	},
	
	async option(interaction, client){

		if (!interaction.replied && !interaction.deferred){
			console.log('deferring the interaction')
			interaction.deferReply({ephemeral: true})
			console.log('interaction deferred')
		}

		var index = 0
		
			const baseURL = 'https://robertsspaceindustries.com'
			var shipPledgeURL = baseURL
			var shipImage = 'Unknown'
			var shipManufLogo = 'Unknown'
			var shipName = 'Unknown'
			var shipManuf = 'Unknown'
			var shipManufCode = 'Unknown'
			var afterburner_speed = 'Unknown'
			var beam = 'Unknown'
			var height = 'Unknown'
			var length = 'Unknown'
			var cargocapacity = 'Unknown'
			var focus = 'Unknown'
			var mass = 'Unknown'
			var size = 'Unknown'
			var max_crew = 'Unknown'
			var min_crew = 'Unknown'
			var price = 'Unknown'
			var production_status = 'Unknown'
			var scm_speed = 'Unknown'
			var modified = 'Unknown'

		if (interaction.values != undefined){
			index = interaction.values[0]
		}
		
		shipName = ship.data[index].name
		shipManuf = ship.data[index].manufacturer.name
		shipManufCode = ship.data[index].manufacturer.code
		
		if (ship.data[index].url.slice(0,4) == 'http'){
			shipPledgeURL = ship.data[index].url
		} else {
			shipPledgeURL = baseURL + ship.data[index].url
		}
		
		if (ship.data[index].media[0].images.cover.slice(0,4) == 'http'){
			shipImg = ship.data[index].media[0].images.cover
		} else {
			shipImg = baseURL + ship.data[index].media[0].images.cover
		}
		
		if (ship.data[index].manufacturer.media[0].images.cover.slice(0,4) == 'http'){
			shipManufLogo = ship.data[index].manufacturer.media[0].images.cover
		} else {
			shipManufLogo = baseURL + ship.data[index].manufacturer.media[0].images.cover
		}
		
		if (ship.data[index].afterburner_speed != '' && ship.data[index].afterburner_speed != null && ship.data[index].afterburner_speed != undefined){
			afterburner_speed = ship.data[index].afterburner_speed
		}
		
		if (ship.data[index].beam != '' && ship.data[index].beam != null && ship.data[index].beam != undefined){
			beam = ship.data[index].beam
		}
		
		if (ship.data[index].height != '' && ship.data[index].height != null && ship.data[index].height != undefined){
			height = ship.data[index].height
		}
		
		if (ship.data[index].length != '' && ship.data[index].length != null && ship.data[index].length != undefined){
			length = ship.data[index].length
		}
		
		if (ship.data[index].cargocapacity != '' && ship.data[index].cargocapacity != null && ship.data[index].cargocapacity != undefined){
			cargocapacity = ship.data[index].cargocapacity
		}
		
		if (ship.data[index].focus != '' && ship.data[index].focus != null && ship.data[index].focus != undefined){
			focus = ship.data[index].focus
		}
		
		if (ship.data[index].mass != '' && ship.data[index].mass != null && ship.data[index].mass != undefined){
			const tmp = ship.data[index].mass.valueOf()
			mass = tmp.toLocaleString() + ' kg'
		}
		
		if (ship.data[index].size != '' && ship.data[index].size != null && ship.data[index].size != undefined){
			size = ship.data[index].size
		}
		
		if (ship.data[index].max_crew != '' && ship.data[index].max_crew != null && ship.data[index].max_crew != undefined){
			max_crew = ship.data[index].max_crew
		}
		
		if (ship.data[index].min_crew != '' && ship.data[index].min_crew != null && ship.data[index].min_crew != undefined){
			min_crew = ship.data[index].min_crew
		}
		
		if (ship.data[index].price != '' && ship.data[index].price != null && ship.data[index].price != undefined){
			price = ship.data[index].price
		}
		
		if (ship.data[index].production_status != '' && ship.data[index].production_status != null && ship.data[index].production_status != undefined){
			production_status = ship.data[index].production_status
		}
		
		if (ship.data[index].scm_speed != '' && ship.data[index].scm_speed != null && ship.data[index].scm_speed != undefined){
			scm_speed = ship.data[index].scm_speed
		}
		
		if (ship.data[index].time_modified_unfiltered != '' && ship.data[index].time_modified_unfiltered != null && ship.data[index].time_modified_unfiltered != undefined){
			modified = ship.data[index].time_modified_unfiltered
		}
		
		var shipDesc = 'This ship has no descriptive information'
		if (ship.data[index].description != null && ship.data[index].description != ''){
			shipDesc = ship.data[index].description
		}
		const database = mysql.createConnection(dbinfo)
		
		database.connect(
			function(err){
				if (err){
					return console.error('Database error: ', err.message)
				}
				console.log('Connected to the MySQL Server')
			}
		)

		database.beginTransaction(function(err){
			console.log("Getting ship information from database")

			const querystring = "Select * from SHIPS join SHOPINV on SHIPS.DisplayName  = REPLACE(SHOPINV.invName, '_', ' ') where DisplayName = '" + shipManufCode + " " + shipName + "'AND Price IS NOT NULL"

			database.query(querystring, function(err, result, fields){
			if(err){ console.log(err.stack) }
				var tmp = result
				console.log(tmp[0])		
				if (result[0]){
					if(result[0]['Mass']){
						mass = result[0]['Mass'].toLocaleString() + ' kg'
					}
				}	
						
				const responseEmbed = new EmbedBuilder()
				.setDescription(shipDesc)	
				.setColor('#0099ff')
				.setTitle(shipName)
				.setURL(shipPledgeURL)
				.setAuthor({name: shipManuf.valueOf()})
				.setThumbnail(shipManufLogo)
				.setTimestamp()
				.setFooter({text:'Official PFC Communication', iconURL:'https://i.imgur.com/5sZV5QN.png'})
				.setImage(shipImg)
				.addFields(
					{ name: 'Height', value: height, inline: true },
					{ name: 'Length', value: length, inline: true  },
					{ name: 'Beam', value: beam, inline: true  },
					{ name: 'Mass', value: mass, inline: true  },
					{ name: 'Focus', value: focus, inline: true  },
					{ name: 'Cargo Capacity', value: cargocapacity, inline: true  },
					{ name: 'Size', value: size, inline: true  },
					{ name: 'Min Crew', value: min_crew, inline: true  },
					{ name: 'Max Crew', value: max_crew, inline: true  },
					{ name: 'SCM Speed', value: scm_speed, inline: true  },
					{ name: 'Production Status', value: production_status, inline: true  },
					{ name: 'Pledge Price', value: '$' + price, inline: true  },
					{ name: '\u200B', value: 'Last Updated: ' + modified  }
				)
				if(result[0]){
					if(result[0]['Price']){
						responseEmbed.addFields({name: 'In-game Price', value: 'aUEC ' + result[0]['Price'].toLocaleString()})
					}
				}

				if( interaction.replied || interaction.deferred){
					console.log('Editying the reply')
					interaction.editReply({ embeds: [responseEmbed], ephemeral: true })
					console.log('Reply edited')
				} else {
					console.log('Sending the reply')
					interaction.reply({ embeds: [responseEmbed], ephemeral: true })
					console.log('Reply sent')
				}
			})
		})

	}		
}