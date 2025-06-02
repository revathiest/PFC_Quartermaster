const {
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  MessageFlags
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const data = new SlashCommandBuilder()
  .setName('hunt')
  .setDescription('Participate in scavenger hunts');

const subcommandsDir = path.join(__dirname, 'hunt');
const subcommandFiles = fs.readdirSync(subcommandsDir).filter(f => f.endsWith('.js'));

for (const file of subcommandFiles) {
  try {
    const subcommandModule = require(`./hunt/${file}`);
    if (typeof subcommandModule.data === 'function') {
      if (subcommandModule.group) {
        data.addSubcommandGroup(subcommandModule.data);
      } else {
        data.addSubcommand(subcommandModule.data);
      }
    }
  } catch (err) {
    console.error(`❌ Failed to load subcommand ${file}:`, err);
  }
}

module.exports = {
  data,
  async execute(interaction, client) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    try {
      if (group) {
        const subcommandGroup = require(`./hunt/${group}`);
        if (subcommandGroup && typeof subcommandGroup.execute === 'function') {
          await subcommandGroup.execute(interaction, client);
          return;
        }
      }

      const subcommand = require(`./hunt/${sub}`);
      if (subcommand && typeof subcommand.execute === 'function') {
        await subcommand.execute(interaction, client);
      } else {
        await interaction.reply({ content: `❌ Subcommand "${sub}" not implemented.`, flags: MessageFlags.Ephemeral });
      }
    } catch (err) {
      console.error(`❌ Failed to execute subcommand ${sub}:`, err);
      await interaction.reply({ content: '❌ Failed to run subcommand.', flags: MessageFlags.Ephemeral });
    }
  }
};
