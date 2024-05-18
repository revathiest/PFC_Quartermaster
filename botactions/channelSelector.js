const { ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');

// Define the roles that can see the channels
const roleNames = ['Pyro Freelancer Corps']; // Add your roles here

/**
 * Fetch channels that have explicit permission overwrites for the specified roles.
 * @param {Guild} guild - The guild object.
 * @returns {Collection<Snowflake, Channel>} - Collection of channels.
 */
async function fetchChannelsForRoles(guild) {
    const roles = guild.roles.cache.filter(role => roleNames.includes(role.name));
    if (roles.size === 0) {
        throw new Error(`None of the roles ${roleNames.join(', ')} found`);
    }

    // Fetch all channels and filter those that have the specified roles in permission overwrites
    const channels = guild.channels.cache.filter(channel =>
        channel.permissionOverwrites.cache.some(perm => 
            roles.has(perm.id) && perm.allow.has(PermissionsBitField.Flags.ViewChannel)
        )
    );

    return channels;
}

/**
 * Create a channel selection menu based on roles.
 * @param {Guild} guild - The guild object.
 * @returns {ActionRowBuilder} - The action row containing the select menu.
 */
async function createChannelSelectMenu(guild) {
    const channels = await fetchChannelsForRoles(guild);

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('channelSelect')
        .setPlaceholder('Select a channel');

    channels.forEach(channel => {
        selectMenu.addOptions({
            label: channel.name,
            value: channel.id
        });
    });

    return new ActionRowBuilder().addComponents(selectMenu);
}

module.exports = { createChannelSelectMenu };
