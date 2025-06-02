jest.mock('../../../config/database', () => ({
  Hunt: { findAll: jest.fn() }
}));

const { Hunt } = require('../../../config/database');
const command = require('../../../commands/hunt/list');
const { MessageFlags } = require('discord.js');

const makeInteraction = () => ({ reply: jest.fn() });

beforeEach(() => jest.clearAllMocks());

test('replies when no hunts exist', async () => {
  Hunt.findAll.mockResolvedValue([]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(interaction.reply).toHaveBeenCalledWith({
    content: '❌ No scavenger hunts found.',
    flags: MessageFlags.Ephemeral
  });
});

test('lists hunts when present', async () => {
  Hunt.findAll.mockResolvedValue([
    { name: 'Test Hunt', status: 'upcoming', starts_at: new Date('2024-01-01'), ends_at: new Date('2024-01-02') }
  ]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  const reply = interaction.reply.mock.calls[0][0];
  expect(reply.embeds[0].data.title).toContain('Scavenger Hunts');
  expect(reply.flags).toBe(MessageFlags.Ephemeral);
});

test('handles fetch errors', async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  Hunt.findAll.mockRejectedValue(new Error('fail'));
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(spy).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith({
    content: '❌ Error fetching hunts.',
    flags: MessageFlags.Ephemeral
  });
  spy.mockRestore();
});

test('handles hunts with missing dates', async () => {
  Hunt.findAll.mockResolvedValue([
    { name: 'Test', status: 'active', starts_at: null, ends_at: null }
  ]);
  const interaction = makeInteraction();
  await command.execute(interaction);
  const value = interaction.reply.mock.calls[0][0].embeds[0].data.fields[0].value;
  expect(value).toContain('N/A');
});
