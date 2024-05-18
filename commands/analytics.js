const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { generateUsageReport, generateVoiceActivityReport, generateReportByChannel, generateReportByRole } = require('./analytics/generateAnalytics');

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
                    { name: 'channel', value: 'channel' },
                    { name: 'role', value: 'role' }
                )),
    async execute(interaction, client) {
        const memberRoles = interaction.member.roles.cache.map(role => role.name);
        if (!allowedRoles.some(role => memberRoles.includes(role))) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        const reportType = interaction.options.getString('type');
        let report;
        let title = `Report for ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`;

        try {
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

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(0x0099ff)  // Use numeric color value
                .setTimestamp();

            for (const row of report) {
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
                    }
                    description += `**${key.replace('_', ' ').toUpperCase()}:** ${value}\n`;
                }
                embed.addFields({ name: '\u200B', value: description, inline: false }); // Use \u200B for a blank field name to avoid clutter
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error generating report:', error);
            await interaction.reply({
                content: 'There was an error while generating the report. Please try again later.',
                ephemeral: true
            });
        }
    },
};
