const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current song'),

    async execute(interaction, client) {
        if (interaction.channel.id == client.chanPFCMusic || interaction.channel.id == client.chanBotTest) {
            let guildQueue = client.player.getQueue(interaction.guild.id)
            if (guildQueue == undefined){
                interaction.reply('There is no song playing right now.')
            } else {
                try{
                    guildQueue.skip()
                } catch (error) {
                    client.channels.cache.get(client.chanBotLog).send (error)
                }
            interaction.reply({content: 'Song Skipped', ephemeral: false})
            }
        } else {
            interaction.reply('I only accept that command in #music')
        }
    }
}