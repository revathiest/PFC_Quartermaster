const { buildAccoladeEmbed } = require('../../utils/accoladeEmbedBuilder');
const { EmbedBuilder } = require('discord.js');

describe('buildAccoladeEmbed', () => {
  test('handles no recipients', () => {
    const embed = buildAccoladeEmbed({ name: 'Test', description: 'Desc' }, []);
    const data = embed.toJSON();
    expect(data.title).toBe('  **Test**');
    expect(data.fields[0]).toEqual(
      expect.objectContaining({ name: 'Recipients', value: '_No current recipients_' })
    );
  });

  test('formats recipients and details', () => {
    const recipients = [
      { displayName: '[TAG] Alice Bob' },
      { displayName: 'Bob' },
      { displayName: 'Charlie' }
    ];

    const embed = buildAccoladeEmbed({ name: 'Medal', description: 'Great', emoji: ':star:', color: 0xabcdef, thumbnail_url: 'https://img', footer_icon_url: 'https://footer' }, recipients);
    const data = embed.toJSON();

    expect(data.title).toBe(':star:  **Medal**');
    expect(data.description).toBe('*Great*');
    expect(data.color).toBe(0xabcdef);
    expect(data.thumbnail.url).toBe('https://img');
    expect(data.footer.iconURL).toBe('https://footer');
    expect(data.fields.length).toBe(3);
    expect(data.fields[0].value).toContain('Alice');
    expect(data.fields[0].value).toContain('\u00A0');
  });
});
