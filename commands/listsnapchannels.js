const { SlashCommandBuilder } = require('@discordjs/builders');
const { listSnapChannels } = require('../botactions/channelManagement/snapChannels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listsnapchannels')
        .setDescription('Lists all snap channels'),
    async execute(interaction) {
        try {
            const channels = await listSnapChannels();
            const channelList = channels.map(channel => `Channel ID: ${channel.channelId}, Purge Time: ${channel.purgeTimeInDays} days, Server ID: ${channel.serverId}`);
            await interaction.reply(`Snap channels:\n${channelList.join('\n')}`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while listing the snap channels.', ephemeral: true });
        }
    },
};
