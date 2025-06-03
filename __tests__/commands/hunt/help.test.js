const help = require('../../../commands/hunt/help');
const { MessageFlags } = require('../../../__mocks__/discord.js');

test('replies with player help embed', async () => {
  const interaction = { reply: jest.fn() };
  await help.execute(interaction);

  const reply = interaction.reply.mock.calls[0][0];
  expect(reply.flags).toBe(MessageFlags.Ephemeral);
  const fields = reply.embeds[0].data.fields.map(f => f.name);
  expect(fields).toEqual([
    '📜 /hunt list',
    '📸 /hunt poi list',
    '📊 /hunt score [user]',
    '🏆 /hunt leaderboard',
    '❔ /hunt help'
  ]);
});
