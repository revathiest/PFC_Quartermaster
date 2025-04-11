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
    console.warn(`[WARN] No model found for type: ${type}`);
    return interaction.reply({
      content: `❌ Unsupported terminal type: \`${type}\``,
      ephemeral: !isPublic
    });
  }

  const records = await model.findAll({ where: { terminal_name: terminal.name } });
  console.log(`[DEBUG] Records retrieved for ${terminal.name}: ${records.length}`);

  if (!records.length) {
    return interaction.reply({
      content: `❌ No inventory data found for terminal \`${terminal.name}\`.`,
      ephemeral: !isPublic
    });
  }

  const chunks = chunkInventory(records);
  const chunk = chunks[page];

  const embed = new EmbedBuilder()
    .setTitle(`📦 Inventory: ${terminal.name}`)
    .setFooter({ text: `Terminal ID: ${terminal.id} • Game Version: ${terminal.game_version || 'N/A'}` })
    .setColor(0x0088cc)
    .setTimestamp();

  const formatRow = (row) => {
    if (type === 'item') return `| ${formatColumn(row.item_name, 30)} | ${String(row.price_buy ?? 'N/A').padStart(7)} | ${String(row.price_sell ?? 'N/A').padStart(7)} |`;
    if (type === 'commodity') return `| ${formatColumn(row.commodity_name, 30)} | ${String(row.price_buy ?? 'N/A').padStart(7)} | ${String(row.price_sell ?? 'N/A').padStart(7)} |`;
    if (type === 'fuel') return `| ${formatColumn(row.commodity_name, 30)} | ${String(row.price_buy ?? 'N/A').padStart(7)} |`;
    if (type === 'vehicle_buy') return `| ${formatColumn(row.vehicle_name, 30)} | ${String(row.price_buy ?? 'N/A').padStart(8)} |`;
    if (type === 'vehicle_rent') return `| ${formatColumn(row.vehicle_name, 30)} | ${String(row.price_rent ?? 'N/A').padStart(7)} |`;
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

  const components = [];

  if (chunks.length > 1) {
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
    components.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`uexinv_public::${terminal.id}::${type}::${page}`)
        .setLabel('📢 Make Public')
        .setStyle(ButtonStyle.Primary)
    ));
  }

  const payload = { embeds: [embed], components, ephemeral: !isPublic };

  if (interaction.replied || interaction.deferred) {
    return interaction.followUp({ ...payload, ephemeral: !isPublic });
  }

  return interaction.reply(payload);
}

const data = new SlashCommandBuilder()
  .setName('uexinventory')
  .setDescription('Browse terminal inventory by location')
  .addStringOption(option =>
    option.setName('location')
      .setDescription('Planet, station, or system')
      .setRequired(true)
  );

async function execute(interaction) {
  const location = interaction.options.getString('location');
  const locationFilter = { [Op.like]: `%${location}%` };
  console.log(`[DEBUG] execute - Location: ${location}`);

  const terminals = await db.UexTerminal.findAll({
    where: {
      [Op.or]: [
        { star_system_name: locationFilter },
        { planet_name: locationFilter },
        { orbit_name: locationFilter },
        { space_station_name: locationFilter },
        { outpost_name: locationFilter },
        { city_name: locationFilter }
      ]
    }
  });

  console.log(`[DEBUG] execute - Terminals found: ${terminals.length}`);

  if (!terminals.length) {
    return interaction.reply({ content: `❌ No terminals found at "${location}".`, ephemeral: true });
  }

  const types = [...new Set(terminals.map(t => t.type).filter(Boolean))];
  const select = new StringSelectMenuBuilder()
    .setCustomId(`uexinv_type_menu::${location}`)
    .setPlaceholder('Select a terminal type')
    .addOptions(types.map(t => ({ label: t, value: t })));

  return interaction.reply({
    content: `Found **${terminals.length}** terminals at **${location}**. Choose a type:`,
    components: [new ActionRowBuilder().addComponents(select)],
    ephemeral: true
  });
}

async function option(interaction) {
  if (interaction.customId === 'uexinv_terminal_menu') {
    const [prefix, terminalId, selectedType] = interaction.values[0].split('::');
    console.log(`[DEBUG] option - Terminal Select: terminalId=${terminalId}, selectedType=${selectedType}`);

    const terminal = await db.UexTerminal.findByPk(terminalId);
    if (!terminal) {
      return interaction.update({
        content: '❌ Terminal not found.',
        components: [],
        ephemeral: true
      });
    }

    return buildInventoryEmbed(interaction, terminal, selectedType);
  }

  const [, location] = interaction.customId.split('::');
  const selectedType = interaction.values[0];
  const locationFilter = { [Op.like]: `%${location}%` };
  console.log(`[DEBUG] option - Location: ${location}, SelectedType: ${selectedType}`);

  const terminals = await db.UexTerminal.findAll({
    where: {
      type: selectedType,
      [Op.or]: [
        { star_system_name: locationFilter },
        { planet_name: locationFilter },
        { orbit_name: locationFilter },
        { space_station_name: locationFilter },
        { outpost_name: locationFilter },
        { city_name: locationFilter }
      ]
    },
    order: [['name', 'ASC']]
  });

  console.log(`[DEBUG] option - Matching terminals: ${terminals.length}`);

  if (!terminals.length) {
    return interaction.update({
      content: `❌ No terminals of type \`${selectedType}\` found at **${location}**.`,
      components: [],
      ephemeral: true
    });
  }

  const terminalOptions = terminals.slice(0, 25).map(term => ({
    label: term.name || term.nickname || term.code,
    value: `uexinv_terminal::${term.id}::${selectedType}`
  }));

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('uexinv_terminal_menu')
      .setPlaceholder('Select a terminal')
      .addOptions(terminalOptions)
  );

  return interaction.update({
    content: `Terminals of type \`${selectedType}\` at **${location}**:`,
    components: [row],
    embeds: [],
    ephemeral: true
  });
}

async function button(interaction) {
  const [action, terminalId, type, pageStr, isPublicRaw] = interaction.customId.split('::');
  const page = parseInt(pageStr, 10);
  const isPublic = isPublicRaw === 'true' || action === 'uexinv_public';

  const terminal = await db.UexTerminal.findByPk(terminalId);
  if (!terminal) {
    return interaction.reply({ content: '❌ Terminal not found.', ephemeral: true });
  }

  const newPage = action === 'uexinv_prev' ? page - 1 : action === 'uexinv_next' ? page + 1 : page;
  return buildInventoryEmbed(interaction, terminal, type, newPage, isPublic);
}

module.exports = { data, execute, option, button };
