const { SlashCommandBuilder } = require('@discordjs/builders');
const { botPermsReq } = require('../config.json');
const { EmbedBuilder, MessageFlags } = require('discord.js'); // required to send the embed to Discord
const Builder = new SlashCommandBuilder();

Builder.type = 1;
Builder.default_member_permissions = botPermsReq;
Builder.setName('org')
    .setDescription('Retrieves information about an Organization from the Star Citizen API')
    .addStringOption(option => option.setName('name').setDescription('The name of the Organization to look up.').setRequired(true));

module.exports = {
    data: Builder,// Already includes:
    help: 'Gets information about a specified RSI organization.',
    category: 'Star Citizen',
    
    async execute(interaction, client) {
        console.log('Executing org command'); // Debug statement

        // Star Citizen API URL definitions
        const SCAApiBase = 'https://api.starcitizen-api.com/77210b95720bd50b3584ead32936dfd4/v1/';
        // API Modes
        const SCApiCache = SCAApiBase + 'cache/';
        const SCApiLive = SCAApiBase + 'live/';
        const SCApiOrganization = 'organization/';
        // Organization
        const SCApiLiveOrganization = SCApiLive + SCApiOrganization;

        const fetch = require('node-fetch'); // required to call the Star Citizen API

        // Get and capitalize the orgname
        let orgname = interaction.options._hoistedOptions[0].value;
        orgname = orgname.toUpperCase(); // Capitalize all letters

        const apiUrl = SCApiLiveOrganization + orgname;
        console.log('API URL:', apiUrl); // Log the URL being called

        try {
            const answer = await fetch(apiUrl).then(response => response.text());
            const org = JSON.parse(answer);

            if (!org?.data) {
                interaction.reply({ content: org.message, flags: MessageFlags.Ephemeral });
                console.log('Organization not found:', org.message); // Debug statement
                return;
            }

            const orgName = org.data.name;
            const orgURL = org.data.url;
            const orgBio = org.data.headline?.plaintext || 'This org has no biographical information';
            const orgLogo = org.data.logo;
            const orgMembers = org.data.members;
            const orgRecruiting = org.data.recruiting ? 'Open' : 'Closed';

            const responseEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${orgName} - ${orgMembers} members`)
                .setURL(orgURL)
                .setThumbnail(orgLogo)
                .setTimestamp()
                .setFooter({ text: 'Official PFC Communication', iconURL: 'https://i.imgur.com/5sZV5QN.png' })
                .setDescription(orgBio)
                .addFields({ name: 'Recruiting Status: ', value: orgRecruiting });

            await interaction.reply({ embeds: [responseEmbed], flags: MessageFlags.Ephemeral });
            console.log('Successfully sent org info'); // Debug statement
        } catch (error) {
            console.error('Error executing org command:', error); // Debug statement
            await interaction.reply({ content: 'There was an error executing the org command.', flags: MessageFlags.Ephemeral });
        }
    }
};
