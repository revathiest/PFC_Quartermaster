const { SlashCommandBuilder } = require('@discordjs/builders');
const { addSnapChannel, removeSnapChannel, listSnapChannels } = require('../../botactions/channelManagement');

module.exports = {
    data: [
        new SlashCommandBuilder()
            .setName('addchannel')
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
            .setName('removechannel')
            .setDescription('Remove a managed channel')
            .addStringOption(option =>
                option.setName('channelid')
                    .setDescription('The ID of the channel')
                    .setRequired(true)),
        new SlashCommandBuilder()
            .setName('listchannels')
            .setDescription('List all managed channels')
    ],
    async execute(interaction) {
        const commandName = interaction.commandName;
        const options = interaction.options;

        if (commandName === 'addchannel') {
            const channelId = options.getString('channelid');
            const purgeTimeInDays = options.getInteger('purgetimeindays');
            const serverId = options.getString('serverid');
            await addSnapChannel(channelId, purgeTimeInDays, serverId);
            await interaction.reply(`Channel ${channelId} added with a purge time of ${purgeTimeInDays} days on server ${serverId}.`);
        } else if (commandName === 'removechannel') {
            const channelId = options.getString('channelid');
            await removeSnapChannel(channelId);
            await interaction.reply(`Channel ${channelId} removed.`);
        } else if (commandName === 'listchannels') {
            const channels = await listSnapChannels();
            const response = channels.map(channel => 
                `Channel ID: ${channel.channelId}, Purge Time: ${channel.purgeTimeInDays} days, Server ID: ${channel.serverId}`
            ).join('\n');
            await interaction.reply(response);
        }
    }
};
