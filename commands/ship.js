const { EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, SlashCommandBuilder } = require ('discord.js') // required to send the embed to Discord
const fetch = require('node-fetch') // required to call the Star Citizen API
const { botPermsReq } = require('../config.json')
const Builder = new SlashCommandBuilder()
var ship

const scapibase = 'https://api.star-citizen.wiki/api/vehicles/'

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder	.setName('ship')
Builder.setDescription('Get information about a Ship')
Builder.addStringOption(option => option.setName('name').setDescription('The name of the ship to look up.').setRequired(true)),

module.exports = {
	data: Builder,

	async execute(interaction, client){

		const shipname = interaction.options._hoistedOptions[0].value

		var url = scapibase + shipname + '?locale=en_EN&include=shops.items'
		
		var answer = await fetch(url).then(response => response.text())
		ship = JSON.parse(answer)	

		if (ship.data == undefined ){
			if (interaction.replied || interaction.deferred){
				interaction.editReply({content: 'I cant find that ship', ephemeral: true})
			} else {
				interaction.reply({content: 'I cant find that ship', ephemeral: true})
			}
			return
		}
		if (ship.data.name != undefined) {
		
			this.option(interaction, client)
			
		}
	},
	
	async option(interaction, client){

		var shipinfo = ship.data
		var shops = shipinfo.shops.data
		
		const baseURL = 'https://robertsspaceindustries.com/pledge/ships/'
		var shipPledgeURL = baseURL
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
		var type = 'Unknown'
		var max_crew = 'Unknown'
		var min_crew = 'Unknown'
		var price = 'Unknown'
		var production_status = 'Unknown'
		var scm_speed = 'Unknown'
		var modified = 'Unknown'
		
		shipName = shipinfo.name
		shipManuf = shipinfo.manufacturer.name
		shipManufCode = shipinfo.manufacturer.code
		afterburner_speed = shipinfo.speed.afterburner.toString()
		beam = shipinfo.sizes.beam.toString()
		height = shipinfo.sizes.height.toString()
		length = shipinfo.sizes.length.toString()
		cargocapacity = shipinfo.cargo_capacity.toString()
		focus = shipinfo.foci[0]
		if (focus.en_EN != undefined){
			focus = focus.en_EN
		}
		mass = shipinfo.mass.toLocaleString() + ' kg'
		if (shipinfo.size.en_EN != undefined){
			size = shipinfo.size.en_EN
		} else {
			size = shipinfo.size 
		}
		if (shipinfo.type.en_EN != undefined){
			type = shipinfo.type.en_EN
		} else {
			type = shipinfo.type
		}
		max_crew = shipinfo.crew.max.toString()
		min_crew = shipinfo.crew.min.toString()
		if (shipinfo.production_status.en_EN != undefined){
			production_status = shipinfo.production_status.en_EN
		} else {
			production_status = shipinfo.production_status
		}
		scm_speed = shipinfo.speed.scm.toString()
		var modified_date = new Date(shipinfo.updated_at);
		modified = modified_date.toDateString();
		if (shops[0] != undefined){
			price = 'aUEC ' + shops[0].items.data[0].base_price.toLocaleString();
		} else {
			price = 'Not available for purchase'
		}
		
		var shipDesc = 'This ship has no descriptive information'
		if (shipinfo.description != null && shipinfo.description != ''){
			if (shipinfo.description.en_EN != undefined){
				shipDesc = shipinfo.description.en_EN
			} else {
				shipDesc = shipinfo.description
			}
		}
		const responseEmbed = new EmbedBuilder()
		.setDescription(shipDesc)	
		.setColor('#0099ff')
		.setTitle(shipName)
		.setURL(shipPledgeURL)
		.setAuthor({name: shipManuf.valueOf()})
		.setTimestamp()
		.setFooter({text:'Official PFC Communication', iconURL:'https://i.imgur.com/5sZV5QN.png'})
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
			{ name: 'Sale Price', value: price, inline: true  },
			{ name: '\u200B', value: 'Last Updated: ' + modified  }
		) 
		if (interaction.replied || interaction.deferred){
			interaction.editReply({ embeds: [responseEmbed], ephemeral: true })
		} else {
			interaction.reply({ embeds: [responseEmbed], ephemeral: true })
		}
	}		
}