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

test('shows menu when multiple matches', async () => {
  isUserVerified.mockResolvedValue(true);
  const i = makeInteraction();
  db.GalactapediaEntry.findOne.mockResolvedValue(null);
  db.GalactapediaEntry.findAll.mockResolvedValue([{ id: 1, title: 't', slug: 's' }]);
  db.GalactapediaEntry.findByPk.mockResolvedValue({ id: 1, title: 't', rsi_url: 'url', api_url: 'api' });
  fetchSCDataByUrl.mockResolvedValue({ data: {} });
  i.channel.awaitMessageComponent.mockResolvedValue({ deferUpdate: jest.fn(), values: ['1'] });
  db.GalactapediaDetail.findByPk.mockResolvedValue({ content: 'c' });

  await command.execute(i);

  expect(i.editReply).toHaveBeenCalledWith(expect.objectContaining({ components: expect.any(Array) }));
  expect(i.channel.awaitMessageComponent).toHaveBeenCalled();
});

test('handles detail fetch failure', async () => {
  isUserVerified.mockResolvedValue(true);
  const i = makeInteraction();
  db.GalactapediaEntry.findOne.mockResolvedValue({ id: 2, title: 't', rsi_url: 'u', api_url: 'a' });
  db.GalactapediaDetail.findByPk.mockResolvedValue(null);
  fetchSCDataByUrl.mockRejectedValue(new Error('fail'));

  await command.execute(i);

  expect(i.editReply).toHaveBeenCalledWith('❌ Failed to fetch Galactapedia detail.');
});

