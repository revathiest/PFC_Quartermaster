jest.mock('../../../config/database', () => ({
  Hunt: { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn() },
  HuntSubmission: { findAll: jest.fn() },
  HuntPoi: { findAll: jest.fn() }
}));
jest.mock('../../../utils/hunt', () => ({ getActiveHunt: jest.fn() }));

const { Hunt, HuntSubmission, HuntPoi } = require('../../../config/database');
const { getActiveHunt } = require('../../../utils/hunt');
const command = require('../../../commands/hunt/leaderboard');
const { MessageFlags, StringSelectMenuBuilder } = require('discord.js');

const makeInteraction = () => ({ reply: jest.fn() });

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});

beforeEach(() => jest.clearAllMocks());

test('replies when no hunts exist', async () => {
  getActiveHunt.mockResolvedValueOnce(null);
  Hunt.findOne.mockResolvedValueOnce(null);
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ No scavenger hunts found.', flags: MessageFlags.Ephemeral });
});

test('shows message when no submissions', async () => {
  getActiveHunt.mockResolvedValueOnce(null);
  Hunt.findOne.mockResolvedValueOnce({ id: 'h1', name: 'Recent' });
  HuntSubmission.findAll.mockResolvedValue([]);
  Hunt.findAll.mockResolvedValue([{ id: 'h1', name: 'Recent' }]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  const reply = interaction.reply.mock.calls[0][0];
  expect(reply.embeds[0].data.description).toBe('❌ No submissions yet for this hunt.');
  expect(reply.components).toBeDefined();
});

test('shows message when submissions not approved', async () => {
  getActiveHunt.mockResolvedValueOnce(null);
  Hunt.findOne.mockResolvedValueOnce({ id: 'h1', name: 'Recent' });
  HuntSubmission.findAll.mockResolvedValue([{ id: 's1', status: 'pending', supersedes_submission_id: null }]);
  Hunt.findAll.mockResolvedValue([{ id: 'h1', name: 'Recent' }]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  const reply = interaction.reply.mock.calls[0][0];
  expect(reply.embeds[0].data.description).toBe('❌ No approved submissions yet for this hunt.');
});

test('builds leaderboard from approved submissions', async () => {
  getActiveHunt.mockResolvedValue({ id: 'h1', name: 'Hunt' });
  HuntSubmission.findAll.mockResolvedValue([
    { id: 's1', user_id: 'u1', poi_id: 'p1', status: 'approved', supersedes_submission_id: null, submitted_at: new Date('2024-01-01') },
    { id: 's2', user_id: 'u2', poi_id: 'p1', status: 'approved', supersedes_submission_id: null, submitted_at: new Date('2024-01-02') }
  ]);
  HuntPoi.findAll.mockResolvedValue([{ id: 'p1', points: 5 }]);
  Hunt.findAll.mockResolvedValue([{ id: 'h1', name: 'Hunt' }]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  const reply = interaction.reply.mock.calls[0][0];
  expect(reply.embeds[0].data.title).toContain('Hunt');
  expect(reply.flags).toBe(MessageFlags.Ephemeral);
  const lines = reply.embeds[0].data.description.split('\n');
  expect(lines[0]).toContain('<@u2>');
  expect(lines[1]).toContain('<@u1>');
});

test('includes select menu with hunts', async () => {
  getActiveHunt.mockResolvedValue({ id: 'h1', name: 'H1' });
  HuntSubmission.findAll.mockResolvedValue([
    { id: 's1', user_id: 'u1', poi_id: 'p1', status: 'approved', supersedes_submission_id: null, submitted_at: new Date('2024-01-01') }
  ]);
  HuntPoi.findAll.mockResolvedValue([{ id: 'p1', points: 3 }]);
  Hunt.findAll.mockResolvedValue([{ id: 'h1', name: 'H1' }, { id: 'h2', name: 'Old' }]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  const options = StringSelectMenuBuilder.mock.instances[0].data.options;
  expect(options).toHaveLength(2);
});

test('option updates leaderboard for selected hunt', async () => {
  Hunt.findByPk.mockResolvedValue({ id: 'h2', name: 'Old' });
  HuntSubmission.findAll.mockResolvedValue([
    { id: 's1', user_id: 'u1', poi_id: 'p1', status: 'approved', supersedes_submission_id: null, submitted_at: new Date('2024-01-01') }
  ]);
  HuntPoi.findAll.mockResolvedValue([{ id: 'p1', points: 2 }]);
  Hunt.findAll.mockResolvedValue([{ id: 'h1', name: 'H1' }, { id: 'h2', name: 'Old' }]);
  const update = jest.fn();

  await command.option({ customId: 'hunt_leaderboard_select', values: ['h2'], update });

  expect(update).toHaveBeenCalled();
});
