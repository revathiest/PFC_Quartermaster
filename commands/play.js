const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Add a song to the queue')
		.addStringOption(option => option.setName('name').setDescription('The name of the song you want to hear.').setRequired(true)),

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