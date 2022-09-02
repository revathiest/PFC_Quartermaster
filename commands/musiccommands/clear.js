const { SlashCommandBuilder } = require('@discordjs/builders')
const { botPermsReq } = require('./../../config.json')
const Builder = new SlashCommandBuilder()

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder.setName('clear')
Builder.setDescription('Clears the current queue.')

module.exports = {
	data: Builder,

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