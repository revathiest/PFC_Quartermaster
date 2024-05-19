const { ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');

// Define the categories
const categoryNames = ['PFCS Channels', 'Public Chat']; // Add your category names here

/**
 * Fetch channels that belong to the specified categories.
 * @param {Guild} guild - The guild object.
 * @returns {Collection<Snowflake, Channel>} - Collection of channels.
 */
async function fetchChannelsForCategories(guild) {

    const categories = guild.channels.cache.filter(channel => 
        categoryNames.includes(channel.name) && channel.type === ChannelType.GuildCategory
    );

    if (categories.size === 0) {
        console.error(`None of the categories ${categoryNames.join(', ')} found. Available categories:`);
        guild.channels.cache.filter(channel => channel.type === ChannelType.GuildCategory).forEach(category => {
            console.error(`- ${category.name}`);
        });
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
