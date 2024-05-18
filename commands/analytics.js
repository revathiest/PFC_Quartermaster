const { SlashCommandBuilder } = require('@discordjs/builders');
const { generateUsageReport, generateVoiceActivityReport, generateReportByChannel, generateReportByRole } = require('./analytics/generateAnalytics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('analytics')
        .setDescription('Generate analytics reports')
        .addStringOption(option => 
            option.setName('type')
                .setDescription('Type of report')
                .setRequired(true)
                .addChoice('usage', 'usage')
                .addChoice('voice', 'voice')
                .addChoice('channel', 'channel')
                .addChoice('role', 'role')
        ),
    async execute(interaction) {
        const reportType = interaction.options.getString('type');
        let report;

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
                return interaction.reply('Invalid report type.');
        }

        let reportMessage = `Report for ${reportType}:\n`;
        report.forEach(row => {
            reportMessage += `${JSON.stringify(row)}\n`;
        });

        await interaction.reply(reportMessage);
    },
};
