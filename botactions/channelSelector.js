const { ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');

async function createChannelSelectMenu(guild) {
    const channels = await guild.channels.fetch();
    const options = channels
        .filter(channel => 
            channel.type === ChannelType.GuildText || 
            channel.type === ChannelType.GuildAnnouncement)
        .map(channel => ({
            label: channel.name,
            value: channel.id,
        }));

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
