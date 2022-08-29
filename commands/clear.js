const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
	data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears the current queue.'),

    async execute(interaction, client) {
        if (interaction.channel.id == client.chanPFCMusic || interaction.channel.id == client.chanBotTest) {
            let guildQueue = client.player.getQueue(interaction.guild.id)
            if (guildQueue == undefined){
                interaction.reply({content: 'There is currently no queue.', ephemeral: true})
            } else {
                try{
                    guildQueue.clearQueue()
                } catch (error) {
                    client.channels.cache.get(client.chanBotLog).send (error)
                }
            interaction.reply({content: 'Queue cleared', ephemeral: false})
            }
        } else {
            interaction.reply('I only accept that command in #music')
        }
    }
}