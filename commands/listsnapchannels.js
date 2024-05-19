const { SlashCommandBuilder } = require('@discordjs/builders');
const { listSnapChannels } = require('../botactions/channelManagement/snapChannels');

const allowedRoles = ['Admiral', 'Fleet Admiral'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listsnapchannels')
        .setDescription('Lists all snap channels'),
    async execute(interaction) {
        if (!allowedRoles.some(role => memberRoles.includes(role))) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }
        try {
            const channels = await listSnapChannels({ where: { serverId: interaction.guild.id } });
            const channelList = channels.map(channel => {
                const channelName = interaction.guild.channels.cache.get(channel.channelId)?.name || channel.channelId;
                return `Channel: ${channelName}, Purge Time: ${channel.purgeTimeInDays} days, Server: ${interaction.guild.name}`;
            });
            await interaction.reply({ content: `Snap channels:\n${channelList.join('\n')}`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while listing the snap channels.', ephemeral: true });
        }
    },
};
