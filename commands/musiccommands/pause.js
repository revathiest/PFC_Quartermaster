const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the music'),

    async execute(interaction, client) {
        if (interaction.channel.id == client.chanPFCMusic || interaction.channel.id == client.chanBotTest) {
            let guildQueue = client.player.getQueue(interaction.guild.id)
            if (guildQueue == undefined){
                interaction.reply('There is no song playing right now.')
            } else {
                try{
                    guildQueue.setPaused(true)
                } catch (error) {
                    client.channels.cache.get(client.chanBotLog).send (error)
                }
            interaction.reply({content: 'Music paused', ephemeral: false})
            }
        } else {
            interaction.reply('I only accept that command in #music')
        }
    }
}