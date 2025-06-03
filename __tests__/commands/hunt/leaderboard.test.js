jest.mock('../../../config/database', () => ({
  Hunt: { findOne: jest.fn() },
  HuntSubmission: { findAll: jest.fn() },
  HuntPoi: { findAll: jest.fn() }
}));

const { Hunt, HuntSubmission, HuntPoi } = require('../../../config/database');
const command = require('../../../commands/hunt/leaderboard');
const { MessageFlags } = require('discord.js');

const makeInteraction = () => ({ reply: jest.fn() });

beforeEach(() => jest.clearAllMocks());

test('replies when no hunts exist', async () => {
  Hunt.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ No scavenger hunts found.', flags: MessageFlags.Ephemeral });
});

test('replies when no submissions', async () => {
  Hunt.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'h1', name: 'Recent' });
  HuntSubmission.findAll.mockResolvedValue([]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ No submissions yet for this hunt.', flags: MessageFlags.Ephemeral });
});

test('builds leaderboard from approved submissions', async () => {
  Hunt.findOne.mockResolvedValue({ id: 'h1', name: 'Hunt' });
  HuntSubmission.findAll.mockResolvedValue([
    { id: 's1', user_id: 'u1', poi_id: 'p1', status: 'approved', supersedes_submission_id: null, submitted_at: new Date('2024-01-01') },
    { id: 's2', user_id: 'u2', poi_id: 'p1', status: 'approved', supersedes_submission_id: null, submitted_at: new Date('2024-01-02') },
    { id: 's3', user_id: 'u2', poi_id: 'p1', status: 'pending', supersedes_submission_id: 's2', submitted_at: new Date('2024-01-03') }
  ]);
  HuntPoi.findAll.mockResolvedValue([{ id: 'p1', points: 5 }]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  const reply = interaction.reply.mock.calls[0][0];
  expect(reply.embeds[0].data.title).toContain('Hunt');
  expect(reply.flags).toBe(MessageFlags.Ephemeral);
  const fields = reply.embeds[0].data.fields;
  expect(fields).toHaveLength(1);
  expect(fields[0].value).toContain('<@u1>');
  expect(fields[0].value).toContain('5');
});
