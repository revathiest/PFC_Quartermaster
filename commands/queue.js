const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
	data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current queue.'),

    async execute(interaction, client) {
        if (interaction.channel.id == client.chanPFCMusic || interaction.channel.id == client.chanBotTest) {
            let guildQueue = client.player.getQueue(interaction.guild.id)
            if (guildQueue == undefined){
                interaction.reply({content: 'The queue is empty', ephemeral: true})
                return
            }
            songs = guildQueue.songs
            if (songs.length <= 10){
                songs.forEach(song => {
                    client.channels.cache.get(client.chanPFCMusic).send(song.name)
                })
                interaction.reply({content: 'Done', ephemeral: true})
            } else {
                client.channels.cache.get(client.chanPFCMusic).send(interaction.user.username + ' requested the queue')
                interaction.reply({content:"Its a long list.  I'll send it to your DMs.", ephemeral: true})
                songs.forEach(song => { 
                    interaction.user.send(song.name)
                })
                //interaction.editReply({content: 'Check your DMs', ephemeral: true})
            }
        } else {
            interaction.reply('I only accept that command in #music')
        }
    }
}