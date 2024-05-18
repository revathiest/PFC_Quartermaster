const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { generateUsageReport, generateVoiceActivityReport, generateReportByChannel, generateReportByRole } = require('./analytics/generateAnalytics');

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
                    { name: 'channel', value: 'channel' },
                    { name: 'role', value: 'role' }
                )),
    async execute(interaction, client) {
        const reportType = interaction.options.getString('type');
        let report;
        let title = `Report for ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`;

        try {
            // Defer the reply to give time for generating the report
            await interaction.deferReply();

            switch (reportType) {
                case 'usage':
                    report = await generateUsageReport();
                    break;
                case 'voice':
                    report = await generateVoiceActivityReport();
                    break;
                case 'channel':
                    report = await generateReportByChannel();
                    break;
                case 'role':
                    report = await generateReportByRole();
                    break;
                default:
                    return interaction.editReply('Invalid report type.');
            }

            if (report.length === 0) {
                return interaction.editReply(`No data found for ${reportType} report.`);
            }

            // Split the report into chunks of 10 items to avoid overwhelming the message
            const chunks = chunkArray(report, 10);

            for (const [index, chunk] of chunks.entries()) {
                const embed = new EmbedBuilder()
                    .setTitle(`${title} (Page ${index + 1}/${chunks.length})`)
                    .setColor(0x0099ff)  // Use numeric color value
                    .setTimestamp();

                for (const row of chunk) {
                    let description = '';
                    for (let [key, value] of Object.entries(row)) {
                        if (key === 'user_id') {
                            const user = await client.users.fetch(value).catch(() => null);
                            value = user ? user.username : 'Unknown User';
                            key = 'User';
                        } else if (key === 'channel_id') {
                            const channel = await client.channels.fetch(value).catch(() => null);
                            value = channel ? channel.name : 'Unknown Channel';
                            key = 'Channel';
                        } else if (key === 'role_id') {
                            const role = await interaction.guild.roles.fetch(value).catch(() => null);
                            value = role ? role.name : 'Unknown Role';
                            key = 'Role';
                        } else if (key === 'server_id') {
                            const server = await client.guilds.fetch(value).catch(() => null);
                            value = server ? server.name : 'Unknown Server';
                            key = 'Server';
                        }
                        description += `**${key.replace('_', ' ').toUpperCase()}:** ${value}\n`;
                    }
                    embed.addFields({ name: '\u200B', value: description, inline: false }); // Use \u200B for a blank field name to avoid clutter
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

// Helper function to chunk an array into smaller arrays of a specified size
function chunkArray(array, size) {
    const chunkedArray = [];
    for (let i = 0; i < array.length; i += size) {
        chunkedArray.push(array.slice(i, i + size));
    }
    return chunkedArray;
}
