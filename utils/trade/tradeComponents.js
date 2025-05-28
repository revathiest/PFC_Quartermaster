const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

function buildShipSelectMenu(vehicles, customIdPrefix = 'trade::select_ship') {

  if (!vehicles?.length) {
    console.warn(`[COMPONENTS] buildShipSelectMenu called with empty vehicle list`);
    return null;
  }

  const options = vehicles.map((v, index) => {
    const label = v.name_full ?? v.name;
    const description = `${v.company_name ?? ''} (${v.scu ?? 0} SCU)`.trim();
    const value = v.id.toString();


    return { label, description, value };
  }).slice(0, 25); // Discord menu max 25 options

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`${customIdPrefix}`)
    .setPlaceholder('Select a ship variant')
    .addOptions(options);


  const row = new ActionRowBuilder().addComponents(menu);


  return row;
}

module.exports = { buildShipSelectMenu };
