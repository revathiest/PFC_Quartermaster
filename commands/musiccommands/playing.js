const { SlashCommandBuilder } = require('@discordjs/builders')
const { botPermsReq } = require('./../../config.json')
const Builder = new SlashCommandBuilder()

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder.setName('playing')
Builder.setDescription('Show the song that is currently playing')

module.exports = {
    data: Builder,

    async execute(interaction, client) {
        if (interaction.channel.id == client.chanPFCMusic || interaction.channel.id == client.chanBotTest) {
            let guildQueue = client.player.getQueue(interaction.guild.id)
            if (guildQueue == undefined){
                interaction.reply('There is no song playing right now.')
            } else {
                try{
                    interaction.reply('Now Playing: ' + guildQueue.nowPlaying)
                } catch (error) {
                    client.channels.cache.get(client.chanBotLog).send(error)
                }
            }
        } else {
            interaction.reply('I only accept that command in #music')
        }
    }
}