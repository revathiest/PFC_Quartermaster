const { ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

async function createChannelSelectMenu(guild) {
    const channels = await guild.channels.fetch();
    const options = channels
        .filter(channel => 
            (channel.type === ChannelType.GuildText || 
             channel.type === ChannelType.GuildAnnouncement) && 
            channel.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.ViewChannel))  // Correct permission flag
        .map(channel => ({
            label: channel.name,
            value: channel.id,
        }))
        .slice(0, 25);  // Limit to 25 options

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('selectChannel')
                .setPlaceholder('Select a channel')
                .addOptions(options)
        );

    return row;
}

module.exports = { createChannelSelectMenu };
