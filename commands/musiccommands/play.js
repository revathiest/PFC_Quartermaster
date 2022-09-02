const { SlashCommandBuilder } = require('@discordjs/builders')
const { botPermsReq } = require('./../../config.json')
const Builder = new SlashCommandBuilder()

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder.setName('play')
Builder.setDescription('Add a song to the queue')
Builder.addStringOption(option => option.setName('name').setDescription('The name of the song you want to hear.').setRequired(true))

module.exports = {
	data: Builder,

    async execute(interaction, client){
        const args = interaction.options._hoistedOptions[0].value
        if (interaction.channel.id == client.chanPFCMusic || interaction.channel.id == client.chanBotTest) {
            let guildQueue = client.player.getQueue(interaction.guild.id)
            let queue = client.player.createQueue(interaction.guild.id)

            try{
                await queue.join(interaction.member.voice.channel)
                interaction.reply({content: 'Adding your song to the queue', ephemeral: false})
            } catch (error) {
                interaction.reply("It doesn't look like you're in a voice channel that I can join.")
                return
            }
            let song = await queue.play(args).catch(error => {
                console.log(error.stack)				
                if(!guildQueue)
                    queue.stop()
            })
        } else {
            interaction.reply({content: 'I only accept that command in #music', ephemeral: true})
        }
    }
}