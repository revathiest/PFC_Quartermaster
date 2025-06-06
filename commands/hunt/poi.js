const { SlashCommandSubcommandGroupBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

function buildGroup() {
  const group = new SlashCommandSubcommandGroupBuilder()
    .setName('poi')
    .setDescription('Manage hunt points of interest');

  const subcommandsDir = path.join(__dirname, 'poi');
  const subcommandFiles = fs.readdirSync(subcommandsDir).filter(f => f.endsWith('.js'));

  for (const file of subcommandFiles) {
    try {
      const subcommand = require(`./poi/${file}`);
      if (typeof subcommand.data === 'function') {
        group.addSubcommand(subcommand.data);
      }
    } catch (err) {
      console.error(`❌ Failed to load POI subcommand ${file}:`, err);
    }
  }

  return group;
}

module.exports = {
  data: buildGroup,
  group: true,
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'create' && !interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      await interaction.reply({ content: 'You do not have permission to use this subcommand.', flags: MessageFlags.Ephemeral });
      return;
    }
    try {
      const subcommand = require(`./poi/${sub}`);
      if (subcommand && typeof subcommand.execute === 'function') {
        await subcommand.execute(interaction, client);
      } else {
        await interaction.reply({ content: `❌ Subcommand "${sub}" not implemented.`, flags: MessageFlags.Ephemeral });
      }
    } catch (err) {
      console.error(`❌ Failed to execute POI subcommand ${sub}:`, err);
      await interaction.reply({ content: '❌ Failed to run POI subcommand.', flags: MessageFlags.Ephemeral });
    }
  }
};
