const { SlashCommandBuilder } = require('@discordjs/builders')
const { botPermsReq } = require('./../../config.json')
const Builder = new SlashCommandBuilder()

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder.setName('stop')
Builder.setDescription('Stops the music and destroys the current queue.')

module.exports = {
	data: Builder,

    async execute(interaction, client) {
        if (interaction.channel.id == client.chanPFCMusic || interaction.channel.id == client.chanBotTest) {
            let guildQueue = client.player.getQueue(interaction.guild.id)
            if (guildQueue == undefined){
                interaction.reply('There is no song playing right now.')
            } else {
                try{
                    guildQueue.stop()
                } catch (error) {
                    client.channels.cache.get(client.chanBotLog).send(error)
                }
            interaction.reply({content: 'Queue Destroyed', ephemeral: false})
            }
        } else {
            interaction.reply('I only accept that command in #music')
        }
    }
}