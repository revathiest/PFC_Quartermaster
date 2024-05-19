const { SlashCommandBuilder } = require('@discordjs/builders');
const { removeSnapChannel } = require('../botactions/channelManagement/snapChannels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removesnapchannel')
        .setDescription('Removes a snap channel')
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('The name of the snap channel')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const channelName = interaction.options.getString('channel');
            removeSnapChannel(channelName);
            await interaction.reply(`Snap channel ${channelName} removed.`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while removing the snap channel.', ephemeral: true });
        }
    },
};
