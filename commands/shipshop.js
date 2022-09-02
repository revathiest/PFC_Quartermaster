const { SlashCommandBuilder } = require('@discordjs/builders')
const { botPermsReq } = require('./../config.json')
const Builder = new SlashCommandBuilder()

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder.setName('shipshop')
Builder.setDescription('Get information about Ship Shops')
Builder.addStringOption(option => option.setName('model').setDescription('The ID of the shop to look up.')),

module.exports ={
	data: Builder,

	async execute(interaction, client){
		
		// message.channel.send("Nice try.  It's not ready yet")
		// return
		
		const { getshopinfo } = require ('./shipshop/getshopinfo.js')
		
		// Database Definitions
		const mysql = require('mysql')
		const connectioninfo = require ("../database.json")
		const database = mysql.createConnection(connectioninfo)
		
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
			try{
				const querystring = "SELECT * FROM gamedata WHERE category_id = 6 AND name = 'Dealership' AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					console.log(result[0].data)
					const dealers = JSON.parse(result[0].data.toString())
					const version = result[0].version
					getshopinfo(interaction, dealers, version)
					console.log('Query completed')
				})
			} catch (error) {
				console.log(error)
			}
		})
		database
			.on('error', (error) => {
				console.log('Database Error: ' + error)
			})
			.on('connect', () => {
				console.log('Database Connected. ')
			})
			.on('end', (error) => {
				console.log('Database Disconnected: ' + error)
			})
			.on('drain', () => {
				console.log('Database Drained. ')
			})
			.on('endqueue', (sequence) => {
				console.log('Database queue ended: ' + sequence)
			})
		
	}
}