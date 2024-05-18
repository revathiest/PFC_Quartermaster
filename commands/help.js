const { SlashCommandBuilder } = require('@discordjs/builders');
const { botPermsReq } = require('../config.json');
const { EmbedBuilder } = require('discord.js');

const Builder = new SlashCommandBuilder();

Builder.type = 1;
Builder.default_member_permissions = botPermsReq;
Builder.setName('help')
    .setDescription('Sends Help information to the user');

module.exports = {
    data: Builder,

    async execute(interaction, client) {
        // Get all registered commands
        const commands = client.commands;
        let helpText = '';

        // Iterate over each command and add its help text
        commands.forEach(command => {
            const commandHelp = command.help || 'No help text available for this command.';
            helpText += `**/${command.data.name}**: ${commandHelp}\n`;
        });

        const responseEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('PFC Quartermaster Help')
            .setDescription(helpText);

        // Send the help text as a direct message to the user
        await interaction.user.send({ embeds: [responseEmbed] });
        // Reply to the interaction to let the user know the help text was sent
        await interaction.reply({ content: 'Check your DMs', ephemeral: true });
    }
};
