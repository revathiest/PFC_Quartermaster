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


test('no matches found', async () => {
  isUserVerified.mockResolvedValue(true);
  const i = makeInteraction();
  db.GalactapediaEntry.findOne.mockResolvedValue(null);
  db.GalactapediaEntry.findAll.mockResolvedValue([]);

  await command.execute(i);

  expect(i.editReply).toHaveBeenCalledWith(expect.stringContaining('No Galactapedia entries'));
});

test('selection timeout handled', async () => {
  isUserVerified.mockResolvedValue(true);
  const i = makeInteraction();
  db.GalactapediaEntry.findOne.mockResolvedValue(null);
  db.GalactapediaEntry.findAll.mockResolvedValue([{ id: 1, title: 't', slug: 's' }]);
  i.channel.awaitMessageComponent.mockRejectedValue(new Error('timeout'));

  await command.execute(i);

  expect(i.editReply).toHaveBeenLastCalledWith({ content: '❌ Selection timed out.', components: [] });
});

test('fetches and stores detail when missing', async () => {
  isUserVerified.mockResolvedValue(true);
  const i = makeInteraction();
  db.GalactapediaEntry.findOne.mockResolvedValue({ id: 3, title: 'x', rsi_url: 'u', api_url: 'api', thumbnail: 't' });
  db.GalactapediaDetail.findByPk
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ content: 'desc' });
  fetchSCDataByUrl.mockResolvedValue({ data: {
    translations: { en_EN: 'desc' },
    categories: [{ category_id: 1, category_name: 'c' }],
    tags: [{ id: 2, name: 'tag' }],
    properties: [{ name: 'p', value: 'v' }],
    related_articles: [{ id: 5, title: 'r', url: 'l', api_url: 'a' }]
  }});

  await command.execute(i);

  expect(db.GalactapediaCategory.destroy).toHaveBeenCalled();
  expect(db.GalactapediaTag.upsert).toHaveBeenCalled();
  expect(i.editReply).toHaveBeenCalledWith(expect.objectContaining({ embeds: expect.any(Array) }));
});

test('handles missing translation content gracefully', async () => {
  isUserVerified.mockResolvedValue(true);
  const i = makeInteraction();
  db.GalactapediaEntry.findOne.mockResolvedValue({ id: 4, title: 'n', rsi_url: 'u', api_url: 'api' });
  db.GalactapediaDetail.findByPk.mockResolvedValue(null);
  fetchSCDataByUrl.mockResolvedValue({ data: { } });
  db.GalactapediaDetail.findByPk.mockResolvedValueOnce(null).mockResolvedValueOnce({ content: 'No content found.' });

  await command.execute(i);

  expect(i.editReply).toHaveBeenCalledWith(expect.objectContaining({ embeds: expect.any(Array) }));
});
