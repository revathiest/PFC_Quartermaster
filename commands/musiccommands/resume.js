const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the music'),

    async execute(interaction, client) {
        if (interaction.channel.id == client.chanPFCMusic || interaction.channel.id == client.chanBotTest) {
            let guildQueue = client.player.getQueue(interaction.guild.id)
            if (guildQueue == undefined){
                interaction.reply('There is no paused song.')
            } else {
                try{
                    guildQueue.setPaused(false)
                } catch (error) {
                    client.channels.cache.get(client.chanBotLog).send (error)
                }
            interaction.reply({content: 'Music resumed', ephemeral: false})
            }
        } else {
            interaction.reply('I only accept that command in #music')
        }
    }
}