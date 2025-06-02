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

const makeInteraction = (withChannel = true) => ({
  options: {
    getString: jest.fn(key => ({
      name: 'Test Hunt',
      description: 'desc',
      start: 'start',
      end: 'end'
    }[key])),
    getChannel: jest.fn(() => withChannel ? { id: 'chan' } : null)
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

  expect(interaction.guild.scheduledEvents.create).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Test Hunt',
    entityType: 2,
    channel: { id: 'chan' }
  }));
  expect(Hunt.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Hunt', discord_event_id: 'e1' }));
  expect(interaction.reply).toHaveBeenCalledWith({ content: expect.stringContaining('Test Hunt'), flags: MessageFlags.Ephemeral });
});

test('creates external event when channel not provided', async () => {
  chrono.parseDate.mockImplementation(str => str === 'start' ? new Date('2025-01-01T00:00:00Z') : new Date('2025-01-02T00:00:00Z'));
  const interaction = makeInteraction(false);

  await command.execute(interaction);

  expect(interaction.guild.scheduledEvents.create).toHaveBeenCalledWith(expect.objectContaining({
    entityType: 3,
    entityMetadata: { location: 'In-Game' }
  }));
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

test('defines subcommand options in required-first order', () => {
  const data = command.data();
  const optionSummary = data.options.map(o => ({ name: o.name, required: o.required }));
  expect(optionSummary).toEqual([
    { name: 'name', required: true },
    { name: 'start', required: true },
    { name: 'end', required: true },
    { name: 'description', required: true },
    { name: 'channel', required: false },
  ]);
});
