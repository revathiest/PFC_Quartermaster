const { SlashCommandBuilder } = require('@discordjs/builders');
const { addSnapChannel } = require('../botactions/channelManagement/snapChannels');

const allowedRoles = ['Admiral', 'Fleet Admiral'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addsnapchannel')
        .setDescription('Adds a snap channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The snap channel to add')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('purgetime')
                .setDescription('Purge time in days (default: 30)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    help: 'Adds a channel to the snap purge list. Messages in snap channels are auto-deleted after a set time.',
    category: 'Admin',
                
    async execute(interaction) {
        const memberRoles = interaction.member.roles.cache.map(role => role.name);
        if (!allowedRoles.some(role => memberRoles.includes(role))) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }
        try {
            const channel = interaction.options.getChannel('channel');
            const purgeTimeInDays = interaction.options.getInteger('purgetime') || 30; // Default to 30 days
            const guild = interaction.guild;
            const channelId = channel.id;
            const serverId = guild.id;

            await addSnapChannel(channelId, purgeTimeInDays, serverId);
            await interaction.reply({ content: `Snap channel ${channel.name} added with a purge time of ${purgeTimeInDays} days.`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while adding the snap channel.', ephemeral: true });
        }
    },
};
