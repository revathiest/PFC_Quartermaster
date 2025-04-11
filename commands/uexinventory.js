// NOTE: This is the DB-backed version of the /uexinventory command with extremely verbose logging

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');
const { Op } = require('sequelize');
const db = require('../config/database');

const PAGE_SIZE = 10;

const TypeToModelMap = {
  item: db.UexItemPrice,
  commodity: db.UexCommodityPrice,
  fuel: db.UexFuelPrice,
  vehicle_buy: db.UexVehiclePurchasePrice,
  vehicle_rent: db.UexVehicleRentalPrice
};

function chunkInventory(items) {
  const pages = [];
  for (let i = 0; i < items.length; i += PAGE_SIZE) {
    pages.push(items.slice(i, i + PAGE_SIZE));
  }
  console.log(`[DEBUG] chunkInventory - Total items: ${items.length}, Pages created: ${pages.length}`);
  return pages;
}

function formatColumn(text, width) {
  if (!text) return ''.padEnd(width);
  const formatted = text.length > width ? text.slice(0, width - 1) + '…' : text.padEnd(width);
  console.log(`[DEBUG] formatColumn - Original: "${text}", Width: ${width}, Result: "${formatted}"`);
  return formatted;
}

async function buildInventoryEmbed(interaction, terminal, type, page = 0, isPublic = false) {
  console.log(`[DEBUG] buildInventoryEmbed - Terminal: ${terminal.name}, Type: ${type}, Page: ${page}, Public: ${isPublic}`);

  const model = TypeToModelMap[type];
  if (!model) {
    console.warn(`[WARN] Unsupported terminal type: ${type}`);
    return interaction.reply({
      content: `❌ Unsupported terminal type: \`${type}\``,
      ephemeral: !isPublic
    });
  }

  console.log(`[DEBUG] Using model: ${model.name || 'Unknown'} for type: ${type}`);

  const records = await model.findAll({ where: { terminal_name: terminal.name } });
  console.log(`[DEBUG] Fetched ${records.length} records from database for terminal: ${terminal.name}`);

  if (!records.length) {
    console.log('[DEBUG] No records found - replying with empty message');
    return interaction.reply({
      content: `❌ No inventory data found for terminal \`${terminal.name}\`.`,
      ephemeral: !isPublic
    });
  }

  const chunks = chunkInventory(records);
  const chunk = chunks[page];
  console.log(`[DEBUG] Page info - Total pages: ${chunks.length}, Current page length: ${chunk.length}`);

  const embed = new EmbedBuilder()
    .setTitle(`📦 Inventory: ${terminal.name}`)
    .setFooter({ text: `Terminal ID: ${terminal.id} • Game Version: ${terminal.game_version || 'N/A'}` })
    .setColor(0x0088cc)
    .setTimestamp();

  const formatRow = (row) => {
    console.log(`[DEBUG] Formatting row for type: ${type}`);
    if (type === 'item') {
      return `| ${formatColumn(row.item_name, 30)} | ${String(row.price_buy ?? 'N/A').padStart(7)} | ${String(row.price_sell ?? 'N/A').padStart(7)} |`;
    }
    if (type === 'commodity') {
      return `| ${formatColumn(row.commodity_name, 30)} | ${String(row.price_buy ?? 'N/A').padStart(7)} | ${String(row.price_sell ?? 'N/A').padStart(7)} |`;
    }
    if (type === 'fuel') {
      return `| ${formatColumn(row.commodity_name, 30)} | ${String(row.price_buy ?? 'N/A').padStart(7)} |`;
    }
    if (type === 'vehicle_buy') {
      return `| ${formatColumn(row.vehicle_name, 30)} | ${String(row.price_buy ?? 'N/A').padStart(8)} |`;
    }
    if (type === 'vehicle_rent') {
      return `| ${formatColumn(row.vehicle_name, 30)} | ${String(row.price_rent ?? 'N/A').padStart(7)} |`;
    }
    return 'Unknown row';
  };

  let header = '| Name                           |     Buy |    Sell |';
  if (type === 'fuel') header = '| Fuel Type                      |     Buy |';
  if (type === 'vehicle_buy') header = '| Vehicle                        |      Buy |';
  if (type === 'vehicle_rent') header = '| Vehicle                        |  Rental |';

  const divider = '|'.padEnd(header.length - 1, '-') + '|';
  const rows = chunk.map(formatRow);
  const table = '```markdown\n' + [header, divider, ...rows].join('\n') + '\n```';
  embed.setDescription(table);
  console.log('[DEBUG] Inventory table constructed');

  const components = [];

  if (chunks.length > 1) {
    console.log('[DEBUG] Adding pagination buttons');
    components.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`uexinv_prev::${terminal.id}::${type}::${page}::${isPublic}`)
        .setLabel('◀️ Prev')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId(`uexinv_next::${terminal.id}::${type}::${page}::${isPublic}`)
        .setLabel('▶️ Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === chunks.length - 1)
    ));
  }

  if (!isPublic) {
    console.log('[DEBUG] Adding Make Public button');
    components.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`uexinv_public::${terminal.id}::${type}::${page}`)
        .setLabel('📢 Make Public')
        .setStyle(ButtonStyle.Primary)
    ));
  }

  const payload = {
    embeds: [embed],
    components,
    ephemeral: !isPublic
  };

  console.log('[DEBUG] Prepared payload for interaction response');

  if (isPublic && interaction.isButton()) {
    console.log('[DEBUG] Interaction is a button, sending public payload...');
    return interaction.replied || interaction.deferred
      ? interaction.followUp({ ...payload, ephemeral: false })
      : interaction.reply({ ...payload, ephemeral: false });
  }

  console.log('[DEBUG] Sending reply payload...');
  return interaction.replied || interaction.deferred
    ? null
    : interaction.reply(payload);
}

module.exports = { buildInventoryEmbed };
