jest.mock('../../../config/database', () => ({
  Config: { upsert: jest.fn() }
}));

const { Config } = require('../../../config/database');
const command = require('../../../commands/hunt/set-channels');
const { MessageFlags } = require('discord.js');

const makeInteraction = () => ({
  options: {
    getChannel: jest.fn(name => ({ id: name === 'activity' ? 'a1' : 'r1' }))
  },
  reply: jest.fn()
});

beforeEach(() => jest.clearAllMocks());

test('stores channel ids and replies', async () => {
  const interaction = makeInteraction();
  await command.execute(interaction);
  expect(Config.upsert).toHaveBeenCalledWith({ key: 'hunt_activity_channel', value: 'a1', botType: 'development' });
  expect(Config.upsert).toHaveBeenCalledWith({ key: 'hunt_review_channel', value: 'r1', botType: 'development' });
  expect(interaction.reply).toHaveBeenCalledWith({
    content: expect.stringContaining('Hunt channels updated'),
    flags: MessageFlags.Ephemeral
  });
});

test('handles db failure', async () => {
  const interaction = makeInteraction();
  const err = new Error('fail');
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  Config.upsert.mockRejectedValue(err);

  await command.execute(interaction);

  expect(spy).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Failed to update channels.', flags: MessageFlags.Ephemeral });
  spy.mockRestore();
});
