const { SlashCommandBuilder } = require('@discordjs/builders');
const { listSnapChannels } = require('../botactions/channelManagement');

module.exports = {
    data: new SlashCommandBuilder()
            .setName('listsnapchannels')
            .setDescription('List all managed channels'),
    async execute(interaction, client) {

        const channels = await listSnapChannels();
        const response = channels.map(channel => 
            `Channel ID: ${channel.channelId}, Purge Time: ${channel.purgeTimeInDays} days, Server ID: ${channel.serverId}`
        ).join('\n');
        await interaction.reply(response);
    }
};
