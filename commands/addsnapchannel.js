const { SlashCommandBuilder } = require('@discordjs/builders');
const { addSnapChannel } = require('../botactions/channelManagement/snapChannels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addsnapchannel')
        .setDescription('Adds a snap channel')
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('The name of the snap channel')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('purgetime')
                .setDescription('Purge time in days (default: 30)')
                .setRequired(false)),
    async execute(interaction) {
        try {
            const channelName = interaction.options.getString('channel');
            const purgeTimeInDays = interaction.options.getInteger('purgetime') || 30; // Default to 30 days
            const guild = interaction.guild;
            const channel = guild.channels.cache.find(ch => ch.name === channelName);

            if (!channel) {
                return await interaction.reply({ content: `Channel ${channelName} not found.`, ephemeral: true });
            }

            const channelId = channel.id;
            const serverId = guild.id;

            await addSnapChannel(channelId, purgeTimeInDays, serverId);
            await interaction.reply(`Snap channel ${channelName} (ID: ${channelId}) added with a purge time of ${purgeTimeInDays} days.`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while adding the snap channel.', ephemeral: true });
        }
    },
};
