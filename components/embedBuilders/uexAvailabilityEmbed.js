// File: components/embedBuilders/uexAvailabilityEmbed.js
const { EmbedBuilder } = require('discord.js');

function buildUexAvailabilityEmbed(type, records) {
  if (!records || records.length === 0) {
    return new EmbedBuilder()
      .setTitle('❌ No results')
      .setDescription('No terminal data found for this entry.')
      .setColor(0xff0000);
  }

  const nameField = {
    item: 'description',
    commodity: 'description',
    vehicle: 'name',
  }[type] || 'description';

  const entryName = records[0][nameField] || 'Unknown';
  const embed = new EmbedBuilder()
    .setTitle(`📍 Locations for: ${entryName}`)
    .setColor(0x00AE86)
    .setFooter({ text: `Type: ${type.charAt(0).toUpperCase() + type.slice(1)}` })
    .setTimestamp();

  for (const record of records) {
    const terminal = record.terminal || {};
    const price = record.price !== null && record.price !== undefined ? `${record.price.toFixed(2)} aUEC` : 'N/A';
    const qty = record.quantity !== null && record.quantity !== undefined ? `${record.quantity}` : 'N/A';

    embed.addFields({
      name: `🏷️ ${terminal.name || 'Unknown Terminal'} (${terminal.type || 'Unknown'})`,
      value: `💰 Price: ${price}\n📦 Qty: ${qty}`,
      inline: false,
    });
  }

  return embed;
}

module.exports = { buildUexAvailabilityEmbed };
