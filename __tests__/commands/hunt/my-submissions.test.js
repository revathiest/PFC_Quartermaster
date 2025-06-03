jest.mock('../../../config/database', () => ({
  Hunt: { findOne: jest.fn() },
  HuntSubmission: { findAll: jest.fn() },
  HuntPoi: { findAll: jest.fn() }
}));

const { Hunt, HuntSubmission, HuntPoi } = require('../../../config/database');
const command = require('../../../commands/hunt/my-submissions');
const { MessageFlags } = require('../../../__mocks__/discord.js');

const makeInteraction = () => ({ user: { id: 'u1' }, reply: jest.fn() });

beforeEach(() => jest.clearAllMocks());

test('replies when no active hunt', async () => {
  Hunt.findOne.mockResolvedValue(null);
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ No active hunt.', flags: MessageFlags.Ephemeral });
});

test('replies when no submissions', async () => {
  Hunt.findOne.mockResolvedValue({ id: 'h1' });
  HuntSubmission.findAll.mockResolvedValue([]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ You have no submissions for this hunt.', flags: MessageFlags.Ephemeral });
});

test('lists submissions grouped by status', async () => {
  Hunt.findOne.mockResolvedValue({ id: 'h1' });
  HuntSubmission.findAll.mockResolvedValue([
    { id: 's1', poi_id: 'p1', status: 'approved', supersedes_submission_id: null },
    { id: 's2', poi_id: 'p2', status: 'rejected', supersedes_submission_id: null },
    { id: 's3', poi_id: 'p3', status: 'pending', supersedes_submission_id: null }
  ]);
  HuntPoi.findAll.mockResolvedValue([
    { id: 'p1', name: 'Alpha', points: 5 },
    { id: 'p2', name: 'Bravo', points: 8 },
    { id: 'p3', name: 'Charlie', points: 3 }
  ]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  const reply = interaction.reply.mock.calls[0][0];
  expect(reply.embeds[0].data.title).toContain('Hunt Submissions');
  expect(reply.embeds[0].data.description).toContain('5');
  const fields = reply.embeds[0].data.fields;
  expect(fields[0].name).toBe('Pending');
  expect(fields[0].value).toBe('Charlie');
  expect(fields[1].name).toBe('Approved');
  expect(fields[1].value).toBe('Alpha (+5 pts)');
  expect(fields[2].name).toBe('Rejected');
  expect(fields[2].value).toBe('Bravo');
});

test('filters superseded submissions', async () => {
  Hunt.findOne.mockResolvedValue({ id: 'h1' });
  HuntSubmission.findAll.mockResolvedValue([
    { id: 's1', poi_id: 'p1', status: 'approved', supersedes_submission_id: null },
    { id: 's2', poi_id: 'p1', status: 'approved', supersedes_submission_id: 's1' }
  ]);
  HuntPoi.findAll.mockResolvedValue([
    { id: 'p1', name: 'Alpha', points: 5 }
  ]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  const fields = interaction.reply.mock.calls[0][0].embeds[0].data.fields;
  // Only the newer submission should be present
  expect(fields.length).toBe(1);
  expect(fields[0].value).toBe('Alpha (+5 pts)');
});
