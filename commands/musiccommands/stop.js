const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
	data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the music and destroys the current queue.'),

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