const { SlashCommandBuilder } = require('@discordjs/builders');
const { addSnapChannel } = require('../botactions/channelManagement');
const { getChannelNameById, getGuildNameById } = require('../botactions/utilityFunctions');

module.exports = {
    data: new SlashCommandBuilder()
            .setName('addsnapchannel')
            .setDescription('Add a new channel to be managed')
            .addStringOption(option => 
                option.setName('channelid')
                    .setDescription('The ID of the channel')
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName('purgetimeindays')
                    .setDescription('Number of days after which messages will be purged')
                    .setRequired(true)),
    async execute(interaction, client) {
        const options = interaction.options;
        const channelId = options.getString('channelid');
        const channelname = await getChannelNameById(channelId, client);
        const purgeTimeInDays = options.getInteger('purgetimeindays');
        const serverId = interaction.guild.id;
        const guildName = getGuildNameById(serverId, client);
        await addSnapChannel(channelId, purgeTimeInDays, serverId);
        await interaction.reply(`Channel ${channelname} added with a purge time of ${purgeTimeInDays} days on server ${guildName}.`);
    }
};
