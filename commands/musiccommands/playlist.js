const { SlashCommandBuilder } = require('@discordjs/builders')
const { botPermsReq } = require('./../../config.json')
const Builder = new SlashCommandBuilder()

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder.setName('playlist')
Builder.setDescription('Add a playlist to the queue')
Builder.addStringOption(option => option.setName('name').setDescription('The url of the playlist you want to hear.').setRequired(true))

module.exports = {
    data: Builder,

    async execute(interaction, client){
        const args = interaction.options._hoistedOptions[0].value
        if (interaction.channel.id == client.chanPFCMusic || interaction.channel.id == client.chanBotTest) {
            let guildQueue = client.player.getQueue(interaction.guild.id)
            let queue = client.player.createQueue(interaction.guild.id)
            try{
                await queue.join(interaction.member.voice.channel)
                interaction.reply({content: 'Adding your playlist to the queue', ephemeral: false})
            } catch (error) {
                interaction.reply("It doesn't look like you're in a voice channel that I can join.")
                return
            }
            let song = await queue.playlist(args).catch(error => {
                console.log(error)
                if(!guildQueue)
                    queue.stop()
            })
        } else {
            interaction.reply('I only accept that command in #music')
        }
    }
}