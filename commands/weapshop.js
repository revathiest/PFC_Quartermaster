const { SlashCommandBuilder } = require('@discordjs/builders')
const { dbinfo } = require('./../config.json')

module.exports ={
	data: new SlashCommandBuilder()
		.setName('weapshop')
		.setDescription('Get information about Weapon Shops **IN DEVELOPMENT**')
		.addStringOption(option => option.setName('name').setDescription('The ID of the shop to look up.'))
		.addStringOption(option => option.setName('location').setDescription('The location of the shop to look up.')),

	role: '849044491343757343',

	async execute(interaction, client){
		const { getshopinfo } = require ('./weapshop/getshopinfo.js')
		
		// Database Definitions
		const mysql = require('mysql')
		const database = mysql.createConnection(dbinfo)
		
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
				const querystring = "SELECT * FROM gamedata WHERE category_id = 6 AND name = 'FPS Weapons Armor' AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					console.log(result[0].data)
					const shops = JSON.parse(result[0].data.toString())
					const version = result[0].version
					getshopinfo(interaction, shops, version)
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
				console.log('Database Enqueued: ' + sequence)
			})
		
	}
}