const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, MessageFlags } = require('discord.js');
const { listSnapChannels } = require('../../botactions/channelManagement/snapChannels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listsnapchannels')
        .setDescription('Lists all snap channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    help: 'Lists all snap channels configured for automatic purge. (Admin Only)',
    category: 'Discord',
    async execute(interaction) {
        try {
            const channels = await listSnapChannels({ where: { serverId: interaction.guild.id } });
            const channelList = channels.map(channel => {
                const channelName = interaction.guild.channels.cache.get(channel.channelId)?.name || channel.channelId;
                return `Channel: ${channelName}, Purge Time: ${channel.purgeTimeInDays} days, Server: ${interaction.guild.name}`;
            });
            await interaction.reply({ content: `Snap channels:\n${channelList.join('\n')}`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while listing the snap channels.', flags: MessageFlags.Ephemeral });
        }
    },
};
