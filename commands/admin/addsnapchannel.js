const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, MessageFlags } = require('discord.js');
const { addSnapChannel } = require('../../botactions/channelManagement/snapChannels');

// Require Kick Members permission instead of a specific role list

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
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    help: 'Adds a channel to the snap purge list. Messages in snap channels are auto-deleted after a set time. (Admin Only)',
    category: 'Discord',
                
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
            return;
        }
        try {
            const channel = interaction.options.getChannel('channel');
            const purgeTimeInDays = interaction.options.getInteger('purgetime') || 30; // Default to 30 days
            const guild = interaction.guild;
            const channelId = channel.id;
            const serverId = guild.id;

            await addSnapChannel(channelId, purgeTimeInDays, serverId);
            await interaction.reply({ content: `Snap channel ${channel.name} added with a purge time of ${purgeTimeInDays} days.`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while adding the snap channel.', flags: MessageFlags.Ephemeral });
        }
    },
};
