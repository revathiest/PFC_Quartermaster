const { SlashCommandBuilder } = require('@discordjs/builders');
const { listSnapChannels } = require('../botactions/channelManagement');

module.exports = {
    data: [
        new SlashCommandBuilder()
            .setName('addsnapchannel')
            .setDescription('Add a new channel to be managed')
            .addStringOption(option => 
                option.setName('channelid')
                    .setDescription('The ID of the channel')
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName('purgetimeindays')
                    .setDescription('Number of days after which messages will be purged')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('serverid')
                    .setDescription('The ID of the server the channel is in')
                    .setRequired(true)),
        new SlashCommandBuilder()
            .setName('removesnapchannel')
            .setDescription('Remove a managed channel')
            .addStringOption(option =>
                option.setName('channelid')
                    .setDescription('The ID of the channel')
                    .setRequired(true)),
        new SlashCommandBuilder()
            .setName('listsnapchannels')
            .setDescription('List all managed channels')
    ],
    async execute(interaction, client) {

        const channels = await listSnapChannels();
        const response = channels.map(channel => 
            `Channel ID: ${channel.channelId}, Purge Time: ${channel.purgeTimeInDays} days, Server ID: ${channel.serverId}`
        ).join('\n');
        await interaction.reply(response);
    }
};
