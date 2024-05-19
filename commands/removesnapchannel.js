const { SlashCommandBuilder } = require('@discordjs/builders');
const { removeSnapChannel } = require('../botactions/channelManagement/snapChannels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removesnapchannel')
        .setDescription('Removes a snap channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The snap channel to remove')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const channel = interaction.options.getChannel('channel');
            const guild = interaction.guild;
            const channelId = channel.id;

            await removeSnapChannel(channelId);
            await interaction.reply({ content: `Snap channel ${channel.name} removed.`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while removing the snap channel.', ephemeral: true });
        }
    },
};
