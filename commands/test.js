const { SlashCommandBuilder } = require('@discordjs/builders')
const { mysql } = require('mysql')

module.exports ={
	data: new SlashCommandBuilder()
	.setName('test')
	.setDescription('A test command for testing discord.js features'),

	async execute(interaction, client){

		const database = mysql.createConnection('../../database.json')
		
		//initiate the database connection
		database.connect(
			function(err){
				if (err){
					return console.error('Database error: ', err.message)
				}
				console.log('Connected to the MySQL Server')
			}
		)
		
		console.log('test')

	}
}