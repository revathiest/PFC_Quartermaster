const { SlashCommandBuilder } = require('@discordjs/builders')
const fetch = require('node-fetch') // required to call the Star Citizen API
	
// Star Citizen API URL 
const SCAApi = 'https://api.starcitizen-api.com/77210b95720bd50b3584ead32936dfd4/v1/live/'
const RequestTypes = [
	'organization/PFCS',
	'organization_members/PFCS',
	'ships',
	'roadmap/starcitizen',
	'progress-tracker',
	'stats',
	'telemetry/3.16?timetable=DAY',
	'starmap/systems',
	'starmap/tunnels',
	'starmap/species',
	'starmap/affiliations'
	]
		

module.exports ={
	data: new SlashCommandBuilder()
		.setName('webupdate')
		.setDescription('*ADMIN COMMAND* Update info from RSI website'),
	role: '849044491343757343', //Server Admin Only

	async execute(interaction, client){
		
		// Database Definitions
		const mysql = require('mysql')
		const database = mysql.createConnection({
			host: 'na05-sql.pebblehost.com',
			user: 'customer_230193_pfc',
			password: 'oZmTmYJ4l5!si1gbCNs@',
			database: 'customer_230193_pfc',
		})
		
		//initiate the database connection
		database.connect(
			function(err){
				if (err){
					return console.error('Database error: ', err.message)
				}
				console.log('Connected to the MySQL Server')
			}
		)
		
		//Bring in everything we want from the shop files.  These are category_id 6
		database.beginTransaction(function(err) {
			if (err) { console.log (err) }	
			try{

				querystring = "DELETE FROM WEB_DATA"
				database.query(querystring)
				database.commit()

			} catch (error) {
				console.log(error)
			}
		})
		
		RequestTypes.forEach(async type => {

			var result = await fetch(SCAApi + type).then(response => response.text())

			result = result.replace(/'/gi, "''")
			result = result.replace(/\\/gi, "\\\\")
			
			querystring = "INSERT INTO WEB_DATA (Date, RequestType, JSON) VALUES (" +
			"NOW(), '" +
			type + "', '" +
			result + "')"
			
			database.beginTransaction(function(err) {
				database.query(querystring)
				database.commit()
			})
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