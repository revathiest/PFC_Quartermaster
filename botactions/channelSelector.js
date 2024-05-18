const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

// Define the categories
const categoryNames = ['PFCS Channels', 'Public Chat']; // Add your category names here

/**
 * Fetch channels that belong to the specified categories.
 * @param {Guild} guild - The guild object.
 * @returns {Collection<Snowflake, Channel>} - Collection of channels.
 */
async function fetchChannelsForCategories(guild) {
    const categories = guild.channels.cache.filter(channel => categoryNames.includes(channel.name) && channel.type === 'GUILD_CATEGORY');
    if (categories.size === 0) {
        throw new Error(`None of the categories ${categoryNames.join(', ')} found`);
    }

    // Fetch all channels and filter those that belong to the specified categories
    const channels = guild.channels.cache.filter(channel =>
        categories.has(channel.parentId)
    );

    return channels;
}

/**
 * Create a channel selection menu based on categories.
 * @param {Guild} guild - The guild object.
 * @returns {ActionRowBuilder} - The action row containing the select menu.
 */
async function createChannelSelectMenu(guild) {
    const channels = await fetchChannelsForCategories(guild);

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
