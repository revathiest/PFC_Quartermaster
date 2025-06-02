jest.mock('../../../config/database', () => ({
  Hunt: { create: jest.fn() }
}));

jest.mock('chrono-node', () => ({
  parseDate: jest.fn()
}));

const chrono = require('chrono-node');
const { Hunt } = require('../../../config/database');
const command = require('../../../commands/hunt/schedule');
const { MessageFlags } = require('discord.js');

const makeInteraction = () => ({
  options: {
    getString: jest.fn(key => ({
      name: 'Test Hunt',
      description: 'desc',
      start: 'start',
      end: 'end'
    }[key])),
    getChannel: jest.fn(() => ({ id: 'chan' }))
  },
  guild: { scheduledEvents: { create: jest.fn().mockResolvedValue({ id: 'e1' }) } },
  reply: jest.fn()
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('creates scheduled event and hunt', async () => {
  chrono.parseDate.mockImplementation(str => str === 'start' ? new Date('2025-01-01T00:00:00Z') : new Date('2025-01-02T00:00:00Z'));
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(interaction.guild.scheduledEvents.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Hunt' }));
  expect(Hunt.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Hunt', discord_event_id: 'e1' }));
  expect(interaction.reply).toHaveBeenCalledWith({ content: expect.stringContaining('Test Hunt'), flags: MessageFlags.Ephemeral });
});

test('rejects invalid times', async () => {
  chrono.parseDate.mockReturnValue(null);
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(interaction.reply).toHaveBeenCalledWith({ content: expect.stringContaining('Invalid'), flags: MessageFlags.Ephemeral });
});

test('handles event creation failure', async () => {
  chrono.parseDate.mockImplementation(str => str === 'start' ? new Date('2025-01-01T00:00:00Z') : new Date('2025-01-02T00:00:00Z'));
  const interaction = makeInteraction();
  const err = new Error('fail');
  interaction.guild.scheduledEvents.create.mockRejectedValue(err);
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await command.execute(interaction);

  expect(spy).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Failed to schedule hunt.', flags: MessageFlags.Ephemeral });
  spy.mockRestore();
});

test('handles database failure', async () => {
  chrono.parseDate.mockImplementation(str => str === 'start' ? new Date('2025-01-01T00:00:00Z') : new Date('2025-01-02T00:00:00Z'));
  const interaction = makeInteraction();
  Hunt.create.mockRejectedValue(new Error('dbfail'));
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await command.execute(interaction);

  expect(spy).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Failed to schedule hunt.', flags: MessageFlags.Ephemeral });
  spy.mockRestore();
});
