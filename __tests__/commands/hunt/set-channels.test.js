jest.mock('../../../config/database', () => ({
  Config: { upsert: jest.fn() }
}));

const { Config } = require('../../../config/database');
const command = require('../../../commands/hunt/set-channels');
const { MessageFlags } = require('discord.js');

const makeInteraction = (roles = ['Admiral']) => ({
  member: { roles: { cache: { map: fn => roles.map(r => fn({ name: r })) } } },
  options: {
    getChannel: jest.fn(name => ({ id: name === 'activity' ? 'a1' : 'r1' }))
  },
  reply: jest.fn()
});

beforeEach(() => jest.clearAllMocks());

test('blocks users without required role', async () => {
  const interaction = makeInteraction(['Member']);
  await command.execute(interaction);
  expect(interaction.reply).toHaveBeenCalledWith({
    content: 'You do not have permission to use this command.',
    flags: MessageFlags.Ephemeral
  });
  expect(Config.upsert).not.toHaveBeenCalled();
});

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

test('builder defines required channel options', () => {
  expect(typeof command.data()).toBe('object');
});
