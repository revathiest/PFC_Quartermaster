const { SlashCommandBuilder } = require('@discordjs/builders')
const { EmbedBuilder, ActionRowBuilder, SelectMenuBuilder } = require ('discord.js') // required to send the embed to Discord

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playing')
        .setDescription('Show the song that is currently playing'),

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