const { ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

async function createChannelSelectMenu(guild) {
    // Fetch the PyroFreelancerCorps role
    const role = guild.roles.cache.find(r => r.name === "Pyro Freelancer Corps");
    
    if (!role) {
        throw new Error("Role 'Pyro Freelancer Corps' not found.");
    } else {
        console.log('Role found');
    }

    // Fetch all channels in the guild
    const channels = await guild.channels.fetch();
    const options = channels
        .filter(channel => 
            (channel.type === ChannelType.GuildText || 
             channel.type === ChannelType.GuildAnnouncement) && 
            channel.permissionsFor(role).has(PermissionFlagsBits.ViewChannel))  // Check permissions for the specific role
        .map(channel => ({
            label: channel.name,
            value: channel.id,
        }))
        .slice(0, 25);  // Limit to 25 options

    // Create the selection menu
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
