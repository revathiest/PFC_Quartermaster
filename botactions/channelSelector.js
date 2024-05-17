const { MessageActionRow, MessageSelectMenu } = require('discord.js');

async function createChannelSelectMenu(guild) {
    const channels = await guild.channels.fetch();
    const options = channels
        .filter(channel => channel.isText())
        .map(channel => ({
            label: channel.name,
            value: channel.id,
        }));

    const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('selectChannel')
                .setPlaceholder('Select a channel')
                .addOptions(options)
        );

    return row;
}

module.exports = { createChannelSelectMenu };
