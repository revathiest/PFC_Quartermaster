const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the current playlist'),

    async execute(interaction, client) {
        if (interaction.channel.id == client.chanPFCMusic || interaction.channel.id == client.chanBotTest) {
            let guildQueue = client.player.getQueue(interaction.guild.id)
            if (guildQueue == undefined){
                interaction.reply('There is queue to shuffle right now.')
            } else {
                try{
                    guildQueue.shuffle()
                } catch (error) {
                    client.channels.cache.get(client.pchanBotLog).send (error)
                }
            interaction.reply({content: 'Now shuffling the playlist', ephemeral: false})
            }
        } else {
            interaction.reply('I only accept that command in #music')
        }
    }
}