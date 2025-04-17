const { EmbedBuilder } = require('discord.js');

function buildAccoladeEmbed(accolade, recipients) {
  const maxFieldLength = 1024;

  const thumbnailUrl = accolade.thumbnail_url || 'https://i.imgur.com/5sZV5QN.png';
  const footerIcon = accolade.footer_icon_url || 'https://i.imgur.com/5sZV5QN.png';

  if (!recipients || recipients.length === 0) {
    return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${accolade.emoji || ''} Accolade: ${accolade.name}`)
      .setDescription(accolade.description || 'No description set.')
      .addFields({ name: 'Recipients', value: '_No current recipients_' })
      .setThumbnail(thumbnailUrl)
      .setTimestamp()
      .setFooter({ text: 'Official PFC Recognition', iconURL: footerIcon });
  }

  // Split into 3 roughly equal columns
  const chunkSize = Math.ceil(recipients.length / 3);
  const columns = [[], [], []];

  recipients.forEach((member, index) => {
    const colIndex = Math.floor(index / chunkSize);

    // 🔍 Strip leading tags like [FOO], (FOO), etc.
    const cleanedName = member.displayName.replace(/^[\[\(\{<][^\]\)\}>]+[\]\)\}>]\s*/g, '');

    // ⛔ Prevent line wrapping by replacing spaces with non-breaking spaces
    const noWrapName = cleanedName.replace(/ /g, '\u00A0');

    columns[colIndex].push(`• ${noWrapName}`);
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
    .setThumbnail(thumbnailUrl)
    .setTimestamp()
    .setFooter({ text: 'Official PFC Recognition', iconURL: footerIcon });
}

module.exports = { buildAccoladeEmbed };
