const { SlashCommandSubcommandGroupBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const data = new SlashCommandSubcommandGroupBuilder()
  .setName('poi')
  .setDescription('Manage hunt points of interest');

const subcommandsDir = path.join(__dirname, 'poi');
const subcommandFiles = fs.readdirSync(subcommandsDir).filter(f => f.endsWith('.js'));

for (const file of subcommandFiles) {
  try {
    const subcommand = require(`./poi/${file}`);
    if (typeof subcommand.data === 'function') {
      data.addSubcommand(subcommand.data);
    }
  } catch (err) {
    console.error(`❌ Failed to load POI subcommand ${file}:`, err);
  }
}

module.exports = {
  data,
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
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
