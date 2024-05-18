const { SlashCommandBuilder } = require('@discordjs/builders');
const { botPermsReq } = require('./../config.json');
const Builder = new SlashCommandBuilder();

Builder.type = 1;
Builder.default_member_permissions = botPermsReq;
Builder.setName('help')
    .setDescription('Sends Help information to the user');

module.exports = {
    data: Builder,

    //============================================================================
    // 20211109 krh Initial Coding
    // 20211112 krh Moved function to its own file
    //============================================================================

    async execute(interaction, client) {
        const { EmbedBuilder } = require('discord.js');

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

        await interaction.user.send({ embeds: [responseEmbed] });
        await interaction.reply({ content: 'Check your DMs', ephemeral: true });
    }
};
