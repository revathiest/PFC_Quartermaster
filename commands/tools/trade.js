const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { safeReply } = require('../../utils/trade/tradeHandlers');

const data = new SlashCommandBuilder()
  .setName('trade')
  .setDescription('Manage trading tools and calculators.');

const subcommandsDir = path.join(__dirname, 'trade');
const subcommandFiles = fs.readdirSync(subcommandsDir).filter(file => file.endsWith('.js'));

for (const file of subcommandFiles) {
  try {
    const subcommandPath = `./trade/${file}`;
    const subcommandModule = require(subcommandPath);

    if (typeof subcommandModule.data === 'function') {
      data.addSubcommand(subcommandModule.data);
    } else if (subcommandModule.data && subcommandModule.data.constructor?.name === 'SlashCommandSubcommandBuilder') {
      console.warn(`⚠️ ${file} exports a pre-built subcommand object instead of a builder function.`);
      data.addSubcommand(() => subcommandModule.data);
    } else {
      console.warn(`⚠️ Skipping ${file}: .data export is missing or invalid (type=${typeof subcommandModule.data})`);
    }
  } catch (err) {
    console.error(`❌ Failed to load subcommand ${file}:`, err);
  }
}

module.exports = {
  data,

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    try {
      const subcommandModule = require(`./trade/${subcommand}`);

      if (subcommandModule && typeof subcommandModule.execute === 'function') {
        await subcommandModule.execute(interaction, client);
      } else {
        console.warn(`[TRADE] Subcommand module "${subcommand}" missing execute function.`);
        await safeReply(interaction, {
          content: `❌ Subcommand "${subcommand}" not implemented.`,
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (err) {
      console.error(`❌ Failed to execute subcommand ${subcommand}:`, err);
      await safeReply(interaction, {
        content: `❌ Failed to load subcommand "${subcommand}".`,
        flags: MessageFlags.Ephemeral
      });
    }
  },

  async option(interaction, client) {
    const customId = interaction.customId;
    const subcommand = customId.split('::')[1];

    try {
      const subcommandModule = require(`./trade/${subcommand}`);

      if (subcommandModule && typeof subcommandModule.option === 'function') {
        await subcommandModule.option(interaction, client);
      } else {
        console.warn(`[TRADE] No option handler function found in "${subcommand}".`);
        await safeReply(interaction, {
          content: `❌ No handler for option in "${subcommand}".`,
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (err) {
      console.error(`❌ Failed to handle option for subcommand "${subcommand}":`, err);
      await safeReply(interaction, {
        content: `❌ Error loading handler for option "${subcommand}".`,
        flags: MessageFlags.Ephemeral
      });
    }
  },

  async button(interaction, client) {
    const customId = interaction.customId;
    const [prefix] = customId.split('::');

    if (!prefix.startsWith('trade_')) return;

    const subcommand = prefix.slice('trade_'.length).split('_')[0];

    try {
      const subcommandModule = require(`./trade/${subcommand}`);

      if (subcommandModule && typeof subcommandModule.button === 'function') {
        await subcommandModule.button(interaction, client);
      } else {
        console.warn(`[TRADE] No button handler function found in "${subcommand}".`);
        await safeReply(interaction, {
          content: `❌ No handler for button in "${subcommand}".`,
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (err) {
      console.error(`❌ Failed to handle button for subcommand "${subcommand}":`, err);
      await safeReply(interaction, {
        content: `❌ Error loading button handler for "${subcommand}".`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
