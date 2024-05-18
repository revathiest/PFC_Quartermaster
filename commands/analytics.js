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

        try {
            await interaction.deferReply();

            switch (reportType) {
                case 'usage':
                    report = await generateUsageReport(serverId);
                    break;
                case 'voice':
                    report = await generateVoiceActivityReport(serverId);
                    break;
                case 'channel':
                    report = await generateReportByChannel(serverId);
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
                    .setTimestamp();

                for (const row of chunk) {
                    let description = '';
                    for (let [key, value] of Object.entries(row)) {
                        if (key === 'channel_id') {
                            const channel = await client.channels.fetch(value).catch(() => null);
                            value = channel ? channel.name : 'Unknown Channel';
                            key = 'Channel';
                        }
                        description += `**${key.replace('_', ' ').toUpperCase()}:** ${value}\n`;
                    }
                    embed.addFields({ name: '\u200B', value: description, inline: false });
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
