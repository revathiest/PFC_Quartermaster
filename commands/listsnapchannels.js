const { SlashCommandBuilder } = require('@discordjs/builders');
const { listSnapChannels } = require('../botactions/channelManagement/snapChannels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listsnapchannels')
        .setDescription('Lists all snap channels'),
    async execute(interaction) {
        try {
            const channels = listSnapChannels();
            await interaction.reply(`Snap channels: ${channels.join(', ')}`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while listing the snap channels.', ephemeral: true });
        }
    },
};
