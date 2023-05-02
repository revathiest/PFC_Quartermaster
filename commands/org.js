const { SlashCommandBuilder } = require('@discordjs/builders')
const { botPermsReq } = require('./../config.json')
const { EmbedBuilder } = require('discord.js') // required to send the embed to Discord
const Builder = new SlashCommandBuilder()

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder.setName('org')
Builder.setDescription('Retrieves information about an Organization from the Star Citizen API')
Builder.addStringOption(option => option.setName('name').setDescription('The name of the Organization to look up.').setRequired(true))

module.exports = {
  data: Builder,

  async execute(interaction, client) {
    // Star Citizen API URL definitions
    const SCAApiBase = 'https://api.starcitizen-api.com/77210b95720bd50b3584ead32936dfd4/v1/'
    //API Modes
    const SCApiCache = SCAApiBase + 'cache/'
    const SCApiLive = SCAApiBase + 'live/'
    const SCApiOrganization = 'organization/'
    //Organization
    const SCApiLiveOrganization = SCApiLive + SCApiOrganization

    const fetch = require('node-fetch') // required to call the Star Citizen API

    const orgname = interaction.options._hoistedOptions[0].value

    const answer = await fetch(SCApiLiveOrganization + orgname).then(response => response.text())
    const org = JSON.parse(answer)

    if (!org?.data) {
      interaction.reply(org.message)
      return
    }

    const orgName = org.data.name
    const orgURL = org.data.url
    const orgBio = org.data.headline?.plaintext || 'This org has no biographical information'
    const orgLogo = org.data.logo
    const orgMembers = org.data.members
    const orgRecruiting = org.data.recruiting ? 'Open' : 'Closed'

    const responseEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${orgName} - ${orgMembers} members`)
      .setURL(orgURL)
      .setThumbnail(orgLogo)
      .setTimestamp()
      .setFooter({ text: 'Official PFC Communication', iconURL: 'https://i.imgur.com/5sZV5QN.png' })
      .setDescription(orgBio)
      .addFields({ name: 'Recruiting Status: ', value: orgRecruiting })

    interaction.user.send({ embeds: [responseEmbed] })
    interaction.reply({ content: 'Check your DMs', ephemeral: true })
  }
}
