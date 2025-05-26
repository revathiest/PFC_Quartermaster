const { EmbedBuilder } = require('../../../__mocks__/discord.js');
const { buildUexAvailabilityEmbed } = require('../../../components/embedBuilders/uexAvailabilityEmbed');

describe('buildUexAvailabilityEmbed', () => {
  test('returns "no results" embed when records empty', () => {
    const embed = buildUexAvailabilityEmbed('item', []);
    const data = embed.toJSON();
    expect(data.title).toContain('No results');
  });

  test('builds embed with fields for each record', () => {
    const records = [
      { description: 'Item A', terminal: { name: 'T1', type: 'Commodity' }, price: 1.23, quantity: 10 }
    ];
    const embed = buildUexAvailabilityEmbed('item', records);
    const data = embed.toJSON();
    expect(data.title).toContain('Locations for: Item A');
    expect(data.fields.length).toBe(1);
    expect(data.fields[0].name).toContain('T1');
  });
});
