jest.mock('../../../config/database', () => ({
  Hunt: { findOne: jest.fn() },
  HuntSubmission: { findAll: jest.fn() },
  HuntPoi: { findAll: jest.fn() }
}));
jest.mock('../../../utils/hunt', () => ({ getActiveHunt: jest.fn() }));

const { Hunt, HuntSubmission, HuntPoi } = require('../../../config/database');
const { getActiveHunt } = require('../../../utils/hunt');
const command = require('../../../commands/hunt/score');
const { MessageFlags } = require('../../../__mocks__/discord.js');

const makeInteraction = (targetId = null) => ({
  user: { id: 'u1', username: 'Req' },
  options: { getUser: jest.fn(() => (targetId ? { id: targetId, username: 'Other' } : null)) },
  reply: jest.fn()
});

beforeEach(() => jest.clearAllMocks());

test('replies when no active hunt', async () => {
  getActiveHunt.mockResolvedValue(null);
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ No active hunt.', flags: MessageFlags.Ephemeral });
});

test('replies when no submissions', async () => {
  getActiveHunt.mockResolvedValue({ id: 'h1' });
  HuntSubmission.findAll.mockResolvedValue([]);
  const interaction = makeInteraction('u2');

  await command.execute(interaction);

  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Other has no submissions for this hunt.', flags: MessageFlags.Ephemeral });
});

test('lists submissions grouped by status', async () => {
  getActiveHunt.mockResolvedValue({ id: 'h1' });
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
  expect(reply.embeds[0].data.title).toBe('🎯 Your Hunt Submissions');
  expect(reply.embeds[0].data.description).toBe('**Total Points Earned:** 🏆 5');
  const fields = reply.embeds[0].data.fields;
  expect(fields[0].name).toBe('⏳ Pending Submissions');
  expect(fields[0].value).toBe('• Charlie');
  expect(fields[1].name).toBe('✅ Approved Submissions');
  expect(fields[1].value).toBe('+ 5 • Alpha');
  expect(fields[2].name).toBe('❌ Rejected Submissions');
  expect(fields[2].value).toBe('• Bravo');
});

test("uses username in title when targeting another user", async () => {
  getActiveHunt.mockResolvedValue({ id: 'h1' });
  HuntSubmission.findAll.mockResolvedValue([
    { id: 's1', poi_id: 'p1', status: 'approved', supersedes_submission_id: null }
  ]);
  HuntPoi.findAll.mockResolvedValue([{ id: 'p1', name: 'Alpha', points: 5 }]);
  const interaction = makeInteraction('u2');

  await command.execute(interaction);

  const title = interaction.reply.mock.calls[0][0].embeds[0].data.title;
  expect(title).toBe("🎯 Other's Hunt Submissions");
});

test('filters superseded submissions', async () => {
  getActiveHunt.mockResolvedValue({ id: 'h1' });
  HuntSubmission.findAll.mockResolvedValue([
    { id: 's1', poi_id: 'p1', status: 'approved', supersedes_submission_id: null },
    { id: 's2', poi_id: 'p1', status: 'approved', supersedes_submission_id: 's1' }
  ]);
  HuntPoi.findAll.mockResolvedValue([
    { id: 'p1', name: 'Alpha', points: 5 }
  ]);
  const interaction = makeInteraction('u1');

  await command.execute(interaction);

  const fields = interaction.reply.mock.calls[0][0].embeds[0].data.fields;
  expect(fields.length).toBe(1);
  expect(fields[0].value).toBe('+ 5 • Alpha');
});
