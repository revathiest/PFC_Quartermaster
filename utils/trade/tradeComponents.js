const DEBUG_COMP = false;

const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

function buildShipSelectMenu(vehicles, customIdPrefix = 'trade::select_ship') {
  if (DEBUG_COMP) console.log(`[COMPONENTS] buildShipSelectMenu called with ${vehicles?.length ?? 0} vehicles, customIdPrefix="${customIdPrefix}"`);

  if (!vehicles?.length) {
    console.warn(`[COMPONENTS] buildShipSelectMenu called with empty vehicle list`);
    return null;
  }

  const options = vehicles.map((v, index) => {
    const label = v.name_full ?? v.name;
    const description = `${v.company_name ?? ''} (${v.scu ?? 0} SCU)`.trim();
    const value = v.id.toString();

    if (DEBUG_COMP) console.log(`[COMPONENTS] Option #${index}: label="${label}", description="${description}", value="${value}"`);

    return { label, description, value };
  }).slice(0, 25); // Discord menu max 25 options

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`${customIdPrefix}`)
    .setPlaceholder('Select a ship variant')
    .addOptions(options);

  if (DEBUG_COMP) console.log(`[COMPONENTS] Created StringSelectMenuBuilder with ${options.length} options`);

  const row = new ActionRowBuilder().addComponents(menu);

  if (DEBUG_COMP) console.log(`[COMPONENTS] Returning ActionRowBuilder with menu`);

  return row;
}

module.exports = { buildShipSelectMenu };
