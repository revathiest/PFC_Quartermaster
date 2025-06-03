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

test('lists submissions with total points', async () => {
  Hunt.findOne.mockResolvedValue({ id: 'h1' });
  HuntSubmission.findAll.mockResolvedValue([
    { poi_id: 'p1', status: 'approved' },
    { poi_id: 'p2', status: 'rejected' }
  ]);
  HuntPoi.findAll.mockResolvedValue([
    { id: 'p1', name: 'Alpha', points: 5 },
    { id: 'p2', name: 'Bravo', points: 8 }
  ]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  const reply = interaction.reply.mock.calls[0][0];
  expect(reply.embeds[0].data.title).toContain('Hunt Submissions');
  expect(reply.embeds[0].data.description).toContain('5');
  const fields = reply.embeds[0].data.fields;
  expect(fields[0].name).toBe('Alpha');
  expect(fields[0].value).toContain('approved');
  expect(fields[1].name).toBe('Bravo');
});
