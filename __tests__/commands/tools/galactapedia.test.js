jest.mock('../../../utils/verifyGuard');
jest.mock('../../../config/database', () => ({
  GalactapediaEntry: { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn() },
  GalactapediaDetail: { findByPk: jest.fn(), upsert: jest.fn() },
  GalactapediaCategory: { destroy: jest.fn(), upsert: jest.fn() },
  GalactapediaTag: { destroy: jest.fn(), upsert: jest.fn() },
  GalactapediaProperty: { destroy: jest.fn(), create: jest.fn() },
  GalactapediaRelatedArticle: { destroy: jest.fn(), upsert: jest.fn() },
}));
jest.mock('../../../utils/fetchSCData');

const { isUserVerified } = require('../../../utils/verifyGuard');
const db = require('../../../config/database');
const { fetchSCDataByUrl } = require('../../../utils/fetchSCData');
const command = require('../../../commands/tools/galactapedia');

const makeInteraction = () => ({
  options: { getString: jest.fn(() => 'foo') },
  user: { id: '1' },
  guild: {},
  deferReply: jest.fn(),
  editReply: jest.fn(),
  reply: jest.fn(),
  channel: { awaitMessageComponent: jest.fn() },
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('rejects unverified users', async () => {
  isUserVerified.mockResolvedValue(false);
  const i = makeInteraction();
  await command.execute(i);
  expect(i.reply).toHaveBeenCalledWith({
    content: expect.stringContaining('verify'),
    flags: expect.any(Number),
  });
});

test('displays existing entry detail', async () => {
  isUserVerified.mockResolvedValue(true);
  const i = makeInteraction();
  db.GalactapediaEntry.findOne.mockResolvedValue({ id: 1, title: 'Test', rsi_url: 'url' });
  db.GalactapediaDetail.findByPk.mockResolvedValue({ content: 'desc' });

  await command.execute(i);

  expect(i.deferReply).toHaveBeenCalled();
  const embed = i.editReply.mock.calls[0][0].embeds[0];
  expect(embed.title).toBe('Test');
});

