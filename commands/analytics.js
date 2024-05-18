const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { generateUsageReport, generateVoiceActivityReport, generateReportByChannel } = require('./analytics/generateAnalytics');

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
                )),
    async execute(interaction, client) {
        const reportType = interaction.options.getString('type');
        const serverId = interaction.guild.id;
        let report;
        let title = `Report for ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`;
        let description;

        try {
            await interaction.deferReply();

            switch (reportType) {
                case 'usage':
                    report = await generateUsageReport(serverId);
                    description = "This report shows the number of events logged in each channel over the past 7 days.";
                    break;
                case 'voice':
                    report = await generateVoiceActivityReport(serverId);
                    description = "This report shows the voice activity in each channel over the past 7 days, including the peak number of users and the total time logged.";
                    break;
                case 'channel':
                    report = await generateReportByChannel(serverId);
                    description = "This report breaks down each type of event that has happened in each channel over the past 7 days.";
                    break;
                default:
                    return interaction.editReply('Invalid report type.');
            }

            if (report.length === 0) {
                return interaction.editReply(`No data found for ${reportType} report.`);
            }

            const chunks = chunkArray(report, 10);

            for (const [index, chunk] of chunks.entries()) {
                const embed = new EmbedBuilder()
                    .setTitle(`${title} (Page ${index + 1}/${chunks.length})`)
                    .setColor(0x0099ff)
                    .setDescription(description)
                    .setTimestamp();

                for (const row of chunk) {
                    const channel = await client.channels.fetch(row.channel_id).catch(() => null);
                    const channelName = channel ? channel.name : 'Unknown Channel';
                    const fieldValue = Object.entries(row)
                        .filter(([key]) => key !== 'channel_id')
                        .map(([key, value]) => `**${key.replace('_', ' ').toUpperCase()}:** ${value}`)
                        .join('\n');
                    embed.addFields({ name: channelName, value: fieldValue, inline: true });
                }

                if (index === 0) {
                    await interaction.editReply({ embeds: [embed] });
                } else {
                    await interaction.followUp({ embeds: [embed] });
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
