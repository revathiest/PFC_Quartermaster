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
  },

  async button(interaction, client) {
    const prefix = interaction.customId.split('::')[0];

    if (!prefix.startsWith('hunt_')) return;

    if (prefix.startsWith('hunt_poi_')) {
      try {
        const list = require('./hunt/poi/list');
        if (typeof list.button === 'function') {
          await list.button(interaction, client);
          return;
        }
      } catch (err) {
        console.error(`❌ Failed to handle button for ${prefix}:`, err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ Something went wrong.', flags: MessageFlags.Ephemeral });
        }
        return;
      }
    }

    console.warn(`⚠️ [HUNT] No button handler found for prefix "${prefix}".`);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Button handler not found.', flags: MessageFlags.Ephemeral });
    }
  },

  async option(interaction, client) {
    const prefix = interaction.customId.split('::')[0];

    if (!prefix.startsWith('hunt_')) return;

    if (prefix.startsWith('hunt_poi_')) {
      try {
        const list = require('./hunt/poi/list');
        if (typeof list.option === 'function') {
          await list.option(interaction, client);
          return;
        }
      } catch (err) {
        console.error(`❌ Failed to handle option for ${prefix}:`, err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ Something went wrong.', flags: MessageFlags.Ephemeral });
        }
        return;
      }
    }

    console.warn(`⚠️ [HUNT] No select menu handler found for prefix "${prefix}".`);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Select menu handler not found.', flags: MessageFlags.Ephemeral });
    }
  },

  async modal(interaction, client) {
    const prefix = interaction.customId.split('::')[0];

    if (!prefix.startsWith('hunt_')) return;

    if (prefix.startsWith('hunt_poi_')) {
      try {
        const list = require('./hunt/poi/list');
        if (typeof list.modal === 'function') {
          await list.modal(interaction, client);
          return;
        }
      } catch (err) {
        console.error(`❌ Failed to handle modal for ${prefix}:`, err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ Something went wrong.', flags: MessageFlags.Ephemeral });
        }
        return;
      }
    }

    console.warn(`⚠️ [HUNT] No modal handler found for prefix "${prefix}".`);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Modal handler not found.', flags: MessageFlags.Ephemeral });
    }
  }
};
