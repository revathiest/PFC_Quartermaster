const { SlashCommandBuilder } = require('@discordjs/builders');
const { removeSnapChannel } = require('../botactions/channelManagement');
const { getChannelNameById } = require('../botactions/utilityFunctions');

module.exports = {
    data: new SlashCommandBuilder()
            .setName('removesnapchannel')
            .setDescription('Remove a managed channel')
            .addStringOption(option =>
                option.setName('channelid')
                    .setDescription('The ID of the channel')
                    .setRequired(true)),
    async execute(interaction, client) {
        const options = interaction.options;
        const channelId = options.getString('channelid');
        const channelName = getChannelNameById(channelId, client);
        await removeSnapChannel(channelId);
        await interaction.reply(`Channel ${channelName} removed.`);
    }
};
