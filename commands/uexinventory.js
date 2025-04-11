// NOTE: This is the DB-backed version of the /uexinventory command

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
  return pages;
}

function formatColumn(text, width) {
  if (!text) return ''.padEnd(width);
  return text.length > width ? text.slice(0, width - 1) + '…' : text.padEnd(width);
}

async function buildInventoryEmbed(interaction, terminal, type, page = 0, isPublic = false) {
  const model = TypeToModelMap[type];
  if (!model) {
    return interaction.reply({
      content: `❌ Unsupported terminal type: \`${type}\``,
      ephemeral: !isPublic
    });
  }

  const records = await model.findAll({ where: { terminal_name: terminal.name } });
  if (!records.length) {
    return interaction.reply({
      content: `❌ No inventory found for terminal \`${terminal.name}\`.`,
      ephemeral: !isPublic
    });
  }

  const pages = chunkInventory(records);
  const chunk = pages[page];
  const embed = new EmbedBuilder()
    .setTitle(`📦 Inventory: ${terminal.name}`)
    .setFooter({ text: `Terminal ID: ${terminal.id} • Game Version: ${terminal.game_version || 'N/A'}` })
    .setColor(0x0088cc)
    .setTimestamp();

  const formatRow = (row) => {
    if (type === 'item') {
      return `| ${formatColumn(row.item_name, 30)} | ${String(row.price_buy ?? 'N/A').padStart(7)} | ${String(row.price_sell ?? 'N/A').padStart(7)} |`;
    }
    if (type === 'commodity' || type === 'refinery') {
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

  const components = [];

  if (pages.length > 1) {
    components.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`uexpage_prev::${terminal.id}::${type}::${page}::${isPublic}`)
        .setLabel('◀️ Prev')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId(`uexpage_next::${terminal.id}::${type}::${page}::${isPublic}`)
        .setLabel('▶️ Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === pages.length - 1)
    ));
  }

  if (!isPublic) {
    components.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`uexpage_public::${terminal.id}::${type}::${page}`)
        .setLabel('📢 Make Public')
        .setStyle(ButtonStyle.Primary)
    ));
  }

  const payload = { embeds: [embed], components, ephemeral: !isPublic };
  return interaction.reply(payload);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uexinventory')
    .setDescription('Browse UEX inventory from local database')
    .addStringOption(option =>
      option.setName('location')
        .setDescription('Planet, station, or system')
        .setRequired(true)
    ),

  async execute(interaction) {
    const location = interaction.options.getString('location');
    const locationFilter = { [Op.like]: `%${location}%` };

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
};