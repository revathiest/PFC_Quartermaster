const help = require('../../../commands/hunt/help');
const { MessageFlags } = require('../../../__mocks__/discord.js');

test('replies with help embed', async () => {
  const interaction = { reply: jest.fn() };
  await help.execute(interaction);
  expect(interaction.reply).toHaveBeenCalledWith({
    embeds: [expect.any(Object)],
    flags: MessageFlags.Ephemeral
  });
});
