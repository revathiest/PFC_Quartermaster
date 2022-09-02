const { SlashCommandBuilder } = require('@discordjs/builders')
const { mysql } = require('mysql')
const { botPermsReq } = require('./../config.json')
const Builder = new SlashCommandBuilder()

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder.setName('test')
Builder.setDescription('A test command for testing discord.js features'),

module.exports ={
	data: Builder,

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