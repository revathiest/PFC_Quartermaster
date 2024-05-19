const { SlashCommandBuilder } = require('@discordjs/builders');
const { addSnapChannel } = require('../botactions/channelManagement/snapChannels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addsnapchannel')
        .setDescription('Adds a snap channel')
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('The name of the snap channel')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const channelName = interaction.options.getString('channel');
            addSnapChannel(channelName);
            await interaction.reply(`Snap channel ${channelName} added.`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while adding the snap channel.', ephemeral: true });
        }
    },
};
