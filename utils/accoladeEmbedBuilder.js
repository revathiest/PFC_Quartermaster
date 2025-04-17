const { EmbedBuilder } = require('discord.js');

function buildAccoladeEmbed(accolade, recipients) {
  const maxFieldLength = 1024;

  const orgFooterIcon = 'https://i.imgur.com/5sZV5QN.png'; // Same icon as the org embed
  const flameThumbnail = 'https://i.imgur.com/5sZV5QN.png'; // <- Replace with your flame image URL

  // If no recipients
  if (!recipients || recipients.length === 0) {
    return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${accolade.emoji || ''} Accolade: ${accolade.name}`)
      .setDescription(accolade.description || 'No description set.')
      .addFields({ name: 'Recipients', value: '_No current recipients_' })
      .setThumbnail(flameThumbnail)
      .setTimestamp()
      .setFooter({ text: 'Official PFC Recognition', iconURL: orgFooterIcon });
  }

  // Split into 3 columns
  const chunkSize = Math.ceil(recipients.length / 3);
  const columns = [[], [], []];

  recipients.forEach((member, index) => {
    const colIndex = Math.floor(index / chunkSize);
    columns[colIndex].push(`• ${member}`);
  });

  const fields = columns
    .filter(col => col.length > 0)
    .map(col => ({
      name: '\u200B',
      value: col.join('\n').slice(0, maxFieldLength),
      inline: true
    }));

  return new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`${accolade.emoji || ''} Accolade: ${accolade.name}`)
    .setDescription(accolade.description || 'No description set.')
    .addFields(fields)
    .setThumbnail(flameThumbnail)
    .setTimestamp()
    .setFooter({ text: 'Official PFC Recognition', iconURL: orgFooterIcon });
}

module.exports = { buildAccoladeEmbed };
