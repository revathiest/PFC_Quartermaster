const { SlashCommandBuilder } = require('discord.js');
const { Accolade } = require('../config/database'); // Adjust path to your model

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addaccolade')
    .setDescription('Register a role as an accolade and post it to the Wall of Fame.')
    .addRoleOption(option => 
      option.setName('role')
        .setDescription('The role to designate as an accolade')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('emoji')
        .setDescription('Emoji for the accolade')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Write-up or explanation for the accolade')
        .setRequired(false)),
  
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const emoji = interaction.options.getString('emoji') || '';
    const description = interaction.options.getString('description') || 'No description provided.';
    const guild = interaction.guild;

    // Check for existing accolade
    const existing = await Accolade.findOne({ where: { role_id: role.id } });
    if (existing) {
      return interaction.reply({ content: 'That role is already registered as an accolade.', ephemeral: true });
    }

    // Find Wall of Fame channel
    const config = require('../config.json'); // Or however you store config
    const channelId = config.wallOfFameChannelId;
    const channel = await guild.channels.fetch(channelId);

    if (!channel || channel.type !== 0 && channel.type !== 'GUILD_TEXT') {
      return interaction.reply({
        content: '❌ The configured Wall of Fame channel is either missing or not text-based.',
        ephemeral: true
      });
    }

    // Get all users with this role
    await guild.members.fetch(); // Make sure cache is up to date
    const recipients = guild.members.cache
      .filter(member => member.roles.cache.has(role.id))
      .map(member => `• ${member}`)
      .join('\n') || '_No current recipients_';

    const content = `${emoji} **[ACCOLADE: ${role.name}]**\n_${description}_\n\n**Recipients:**\n${recipients}\n_Added: <t:${Math.floor(Date.now() / 1000)}:F>_`;

    const message = await channel.send(content);

    // Save to DB
    await Accolade.create({
      role_id: role.id,
      name: role.name,
      emoji,
      description,
      message_id: message.id,
      channel_id: channel.id,
      date_added: Math.floor(Date.now() / 1000),
    });

    return interaction.reply({ content: `Accolade **${role.name}** registered and posted to the Wall of Fame!`, ephemeral: true });
  }
};
