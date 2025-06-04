const help = require('../../../commands/hunt/help-admin');
const { MessageFlags } = require('../../../__mocks__/discord.js');

test('replies with admin help embed', async () => {
  const interaction = { reply: jest.fn() };
  await help.execute(interaction);

  const reply = interaction.reply.mock.calls[0][0];
  expect(reply.flags).toBe(MessageFlags.Ephemeral);
  const fields = reply.embeds[0].data.fields.map(f => f.name);
  expect(fields).toEqual([
    '🛡️ /hunt set-channels',
    '✨ /hunt poi create',
    '📝 /hunt poi list'
  ]);
});
