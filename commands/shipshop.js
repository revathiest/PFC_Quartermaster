const { SlashCommandBuilder } = require('@discordjs/builders')
const { botPermsReq } = require('./../config.json')
const Builder = new SlashCommandBuilder()
const mysql = require('mysql')

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder.setName('shipshop')
Builder.setDescription('Get information about Ship Shops')
Builder.addStringOption(option => option.setName('shopid').setDescription('The ID of the shop to look up.')),

module.exports ={
    data: Builder,

    async execute(interaction, client){

        if (!interaction.replied){
            interaction.deferReply({ephemeral: true})
        }

        const { getshopinfo } = require ('./shipshop/getshopinfo.js')

        const { dbinfo } = require ("../config.json")
        const database = mysql.createConnection(dbinfo)

        database.connect((err) => {
            if (err) {
                console.error('Database error:', err.message)
                return
            }
            console.log('Connected to the MySQL Server')
        })

        const querystring = "SELECT * FROM gamedata WHERE category_id = 6 AND name = 'Dealership' AND version = (SELECT MAX(version) FROM gamedata)"
        database.query(querystring, function (err, result, fields) {
            if (err) {
                console.log('Error:', err.message)
                database.end()
                return
            }

            const dealers = JSON.parse(result[0].data.toString())
            const version = result[0].version
            getshopinfo(interaction, dealers, version)
            console.log('Query completed')

            database.end()
        })

        database.on('error', (error) => {
            console.log('Database Error:', error)
        })
        database.on('end', (error) => {
            console.log('Database Disconnected:', error)
        })
        database.on('drain', () => {
            console.log('Database Drained.')
        })
        database.on('endqueue', (sequence) => {
            console.log('Database queue ended:', sequence)
        })
    }
}
