const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Retrieves user information from the Star Citizen API')
        .addStringOption(option => option.setName('name').setDescription('The name of the user to look up.')),

    async execute(interaction, client) {
        console.log('Executing user command'); // Debug statement

        // Star Citizen API URL definitions
        const SCAApiBase = 'https://api.starcitizen-api.com/77210b95720bd50b3584ead32936dfd4/v1/';
        // API Modes
        const SCApiCache = SCAApiBase + 'cache/';
        const SCApiLive = SCAApiBase + 'live/';
        const SCApiAuto = SCAApiBase + 'auto/';
        const SCApiEager = SCAApiBase + 'eager/';
        // API Categories
        const SCApiUser = 'user/';
        // Users
        const SCApiCacheUser = SCApiCache + SCApiUser;
        const SCApiLiveUser = SCApiLive + SCApiUser;
        const SCApiAutoUser = SCApiAuto + SCApiUser;
        const SCApiEagerUser = SCApiEager + SCApiUser;

        const fetch = require('node-fetch'); // required to call the Star Citizen API

        const username = interaction.options.getString('name');
        console.log('Username:', username); // Debug statement

        const apiUrl = SCApiEagerUser + username;
        console.log('API URL:', apiUrl); // Debug statement

        try {
            const answer = await fetch(apiUrl).then(response => response.text());
            console.log('API response:', answer); // Debug statement
            const user = JSON.parse(answer);
            console.log('Parsed user data:', user); // Debug statement

            if (user.data == null) {
                interaction.reply({ content: user.message, ephemeral: true });
                console.log('User not found:', user.message); // Debug statement
                return;
            }

            if (user.data.profile != undefined) {
                const userName = user.data.profile.display;
                const userURL = user.data.profile.page.url;
                const userImg = user.data.profile.image;
                let userBio = 'This user has no biographical information';
                if (user.data.profile.bio != null && user.data.profile.bio != '') {
                    userBio = user.data.profile.bio;
                }
                let userOrg = 'Organization Redacted';
                if (user.data.organization.name != null && user.data.organization.name != '') {
                    userOrg = user.data.organization.name;
                }
                let userOrgRank = 'Rank Unknown';
                if (user.data.organization.rank != null && user.data.organization.rank != '') {
                    userOrgRank = user.data.organization.rank;
                }
                const userOrgImg = user.data.organization.image;
                const userOrgSID = user.data.organization.sid;

                const responseEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(userOrgRank + ' - ' + userName)
                    .setURL(userURL)
                    .setAuthor({ name: userOrg, iconURL: userOrgImg, url: 'https://robertsspaceindustries.com/orgs/' + userOrgSID })
                    .setThumbnail(userImg)
                    .setTimestamp()
                    .setFooter({ text: 'Official PFC Communication', iconURL: 'https://i.imgur.com/5sZV5QN.png' });

                if (user.data.profile.website != undefined) {
                    userBio = userBio + '\n' + user.data.profile.website;
                }

                responseEmbed.setDescription(userBio);

                if (user.data.affiliation != null && user.data.affiliation != '') {
                    const affil = user.data.affiliation;
                    let afflist = null;

                    affil.forEach(aff => {
                        if (aff.name == null || aff.name == '') {
                            aff.name = 'Redacted';
                            aff.rank = 'Unknown';
                        }
                        if (afflist == null) {
                            afflist = aff.name + ' - ' + aff.rank;
                        } else {
                            afflist = afflist + '\n' + aff.name + ' - ' + aff.rank;
                        }
                    });

                    responseEmbed.addFields({ name: 'Organization Affiliations', value: afflist });
                }

                await interaction.reply({ embeds: [responseEmbed], ephemeral: true });
                console.log('Successfully sent user info'); // Debug statement
            } else {
                await interaction.reply({ content: 'That user does not exist.', ephemeral: true });
                console.log('User does not exist'); // Debug statement
            }
        } catch (error) {
            console.error('Error executing user command:', error); // Debug statement
            await interaction.reply({ content: 'There was an error executing the user command.', ephemeral: true });
        }
    }
};
