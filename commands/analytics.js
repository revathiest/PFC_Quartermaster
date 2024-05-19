const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { generateUsageReport, generateVoiceActivityReport, generateReportByChannel } = require('./analytics/generateAnalytics');

const allowedRoles = ['Admiral', 'Fleet Admiral'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('analytics')
        .setDescription('Generate analytics reports')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of report')
                .setRequired(true)
                .addChoices(
                    { name: 'usage', value: 'usage' },
                    { name: 'voice', value: 'voice' },
                    { name: 'channel', value: 'channel' }
                ))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel for channel report')
                .setRequired(false)
        ),
    async execute(interaction, client) {
        const memberRoles = interaction.member.roles.cache.map(role => role.name);
        if (!allowedRoles.some(role => memberRoles.includes(role))) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }
        const reportType = interaction.options.getString('type');
        const serverId = interaction.guild.id;
        const channelOption = interaction.options.getChannel('channel');
        let report;
        let title = `Report for ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`;
        let description;

        try {
            await interaction.deferReply({ephemeral: true});

            switch (reportType) {
                case 'usage':
                    report = await generateUsageReport(serverId);
                    description = "This report shows the number of events logged in each channel over the past 7 days.";
                    break;
                case 'voice':
                    report = await generateVoiceActivityReport(serverId);
                    description = "This report shows the voice activity in each channel over the past 7 days, including the average number of users, peak number of users, and the total time logged.";
                    break;
                case 'channel':
                    if (!channelOption) {
                        return interaction.editReply({content: 'You need to specify a channel for the channel report.', ephemeral: true});
                    }
                    const channelId = channelOption.id;
                    report = await generateReportByChannel(serverId, channelId);
                    description = `This report breaks down each type of event that has happened in the channel ${channelOption.name} over the past 7 days.`;
                    break;
                default:
                    await interaction.editReply({content: 'Invalid report type.', ephemeral: true});
                    return;
            }

            if (report.length === 0) {
                return interaction.editReply({content: `No data found for ${reportType} report.`, ephemeral: true});
            }

            const chunks = chunkArray(report, 10);

            for (const [index, chunk] of chunks.entries()) {
                const embed = new EmbedBuilder()
                    .setTitle(`${title} (Page ${index + 1}/${chunks.length})`)
                    .setColor(0x0099ff)
                    .setDescription(description)
                    .setTimestamp();

                if (reportType === 'usage') {
                    let channelsField = '';
                    let eventCountField = '';
                    for (const row of chunk) {
                        const channel = await client.channels.fetch(row.channel_id).catch(() => null);
                        const channelName = channel ? channel.name : 'Unknown Channel';
                        channelsField += `${channelName}\n`;
                        eventCountField += `${row.event_count}\n`;
                    }
                    embed.addFields(
                        { name: 'Channel', value: channelsField, inline: true },
                        { name: 'Event Count', value: eventCountField, inline: true }
                    );
                } else if (reportType === 'channel') {
                    let eventTypeField = '';
                    let eventCountField = '';
                    for (const row of chunk) {
                        eventTypeField += `${row.event_type}\n`;
                        eventCountField += `${row.event_count}\n`;
                    }
                    embed.addFields(
                        { name: 'Event Type', value: eventTypeField, inline: true },
                        { name: 'Event Count', value: eventCountField, inline: true }
                    );
                } else if (reportType === 'voice') {
                    let channelsField = '';
                    let usersField = '';
                    let totalTimeField = '';
                    for (const row of chunk) {
                        const channel = await client.channels.fetch(row.channel_id).catch(() => null);
                        const channelName = channel ? channel.name : 'Unknown Channel';
                        channelsField += `${channelName}\n`;
                        usersField += `Avg: ${row.average_users}, Peak: ${row.peak_users}\n`;
                        totalTimeField += `${row.total_duration}\n`;
                    }
                    embed.addFields(
                        { name: 'Channel', value: channelsField, inline: true },
                        { name: 'Users', value: usersField, inline: true },
                        { name: 'Total Time', value: totalTimeField, inline: true }
                    );
                }

                if (index === 0) {
                    await interaction.editReply({ embeds: [embed], ephemeral: true });
                } else {
                    await interaction.followUp({ embeds: [embed], ephemeral: true });
                }
            }
        } catch (error) {
            console.error('Error generating report:', error);
            await interaction.editReply({
                content: 'There was an error while generating the report. Please try again later.',
                ephemeral: true
            });
        }
    },
};

function chunkArray(array, size) {
    const chunkedArray = [];
    for (let i = 0; i < array.length; i += size) {
        chunkedArray.push(array.slice(i, i + size));
    }
    return chunkedArray;
}
