const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require ('discord.js') // required to send the embed to Discord
const fetch = require('node-fetch') // required to call the Star Citizen API
var ship

module.exports ={
	data: new SlashCommandBuilder()
		.setName('ship')
		.setDescription('Get information about a Ship')
		.addStringOption(option => option.setName('name').setDescription('The name of the ship to look up.').setRequired(true)),

	async execute(interaction, client){
		
		const shipname = interaction.options._hoistedOptions[0].value
		
		// Star Citizen API URL 
		const SCAApi = 'https://api.starcitizen-api.com/77210b95720bd50b3584ead32936dfd4/v1/eager/ships?name='


		
		if (shipname == '' || shipname == undefined){
			interaction.reply({content: 'Which ship do you want me to find?', ephemeral: true})
			return
		}
		
		interaction.reply({content: 'Let me think about that...', ephemeral: true})
		
		var answer = await fetch(SCAApi + shipname).then(response => response.text())
		ship = JSON.parse(answer)	

		if (ship.data[0] == undefined ){
			interaction.editReply({content: 'I cant find that ship', ephemeral: true})
			return
		}
		if (ship.data[0].name != undefined) {
			
			if (ship.data.length > 1) {
				
				const row = new MessageActionRow()
				var options = new MessageSelectMenu()
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
				
				interaction.editReply({content: "I've found more than one ship that meets that filter.  Which one do you want?", components: [row]})
			
			} else {
		
				this.option(interaction, client)
				
			}
			
		} else {
			interaction.editReply({content: 'That ship does not exist.', ephemeral: true})
		}
	},
	
	async option(interaction, client){

		var index = 0
		
			const baseURL = 'https://robertsspaceindustries.com'
			var shipPledgeURL = baseURL
			var shipImage = 'Unknown'
			var shipManufLogo = 'Unknown'
			var shipName = 'Unknown'
			var shipManuf = 'Unknown'
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
			mass = tmp.toLocaleString() + 'kg'
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
		
		
		const responseEmbed = new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(shipName)
		.setURL(shipPledgeURL)
		.setAuthor(shipManuf)
		.setThumbnail(shipManufLogo)
		.setTimestamp()
		.setFooter('Official PFC Communication', 'https://i.imgur.com/5sZV5QN.png')
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

		responseEmbed.setDescription(shipDesc)		
		interaction.user.send({ embeds: [responseEmbed] })
		
		if( !interaction.replied){
			interaction.reply({content: 'Check your DMs', ephemeral: true})
		} else {
			interaction.editReply({content: 'Check your DMs', ephemeral: true})
		}
	}		
}