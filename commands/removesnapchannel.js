const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const { removeSnapChannel } = require('../botactions/channelManagement/snapChannels');

const allowedRoles = ['Admiral', 'Fleet Admiral'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removesnapchannel')
        .setDescription('Removes a snap channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The snap channel to remove')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    help: 'Removes a channel from the snap purge list.',
    category: 'Admin',

    async execute(interaction) {
        const memberRoles = interaction.member.roles.cache.map(role => role.name);
        if (!allowedRoles.some(role => memberRoles.includes(role))) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }
        try {
            const channel = interaction.options.getChannel('channel');
            const guild = interaction.guild;
            const channelId = channel.id;

            await removeSnapChannel(channelId);
            await interaction.reply({ content: `Snap channel ${channel.name} removed.`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while removing the snap channel.', ephemeral: true });
        }
    },
};
