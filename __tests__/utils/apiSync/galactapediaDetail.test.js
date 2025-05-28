jest.mock('../../../utils/fetchSCData', () => ({ fetchSCDataByUrl: jest.fn() }));
jest.mock('../../../config/database', () => ({
  GalactapediaDetail: { upsert: jest.fn() },
  GalactapediaTag: { destroy: jest.fn(), bulkCreate: jest.fn() },
  GalactapediaProperty: { destroy: jest.fn(), bulkCreate: jest.fn() },
  GalactapediaRelatedArticle: { destroy: jest.fn(), bulkCreate: jest.fn() },
}));

const { fetchSCDataByUrl } = require('../../../utils/fetchSCData');
const db = require('../../../config/database');
const { syncGalactapediaDetail } = require('../../../utils/apiSync/galactapediaDetail');

describe('syncGalactapediaDetail', () => {
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test('saves details and related data', async () => {
    fetchSCDataByUrl.mockResolvedValue({ data: { id: 1, translations: { en_EN: 'text' }, tags: [], properties: [], related_articles: [] } });

    const res = await syncGalactapediaDetail({ api_url: 'url', id: 1 });
    expect(fetchSCDataByUrl).toHaveBeenCalledWith('url');
    expect(db.GalactapediaDetail.upsert).toHaveBeenCalled();
    expect(res).toBe(true);
  });

  test('saves tags, properties, and related articles', async () => {
    fetchSCDataByUrl.mockResolvedValue({
      data: {
        id: 2,
        created_at: '2020-01-01',
        translations: { en_EN: 'detail' },
        tags: [{ id: 10, name: 'Tag' }],
        properties: [{ name: 'Key', value: 'Val' }],
        related_articles: [{ id: 9, title: 'Rel', url: '/rel', api_url: 'relUrl' }]
      }
    });

    const res = await syncGalactapediaDetail({ api_url: 'url2', id: 2 });

    expect(db.GalactapediaTag.destroy).toHaveBeenCalledWith({ where: { article_id: 2 } });
    expect(db.GalactapediaTag.bulkCreate).toHaveBeenCalledWith([
      { article_id: 2, tag_id: 10, tag_name: 'Tag' }
    ]);
    expect(db.GalactapediaProperty.destroy).toHaveBeenCalledWith({ where: { article_id: 2 } });
    expect(db.GalactapediaProperty.bulkCreate).toHaveBeenCalledWith([
      { article_id: 2, name: 'Key', value: 'Val' }
    ]);
    expect(db.GalactapediaRelatedArticle.destroy).toHaveBeenCalledWith({ where: { article_id: 2 } });
    expect(db.GalactapediaRelatedArticle.bulkCreate).toHaveBeenCalledWith([
      { article_id: 2, related_id: 9, title: 'Rel', url: '/rel', api_url: 'relUrl' }
    ]);
    expect(res).toBe(true);
  });

  test('handles fetch failure gracefully', async () => {
    fetchSCDataByUrl.mockRejectedValue(new Error('fail'));
    const res = await syncGalactapediaDetail({ api_url: 'bad', id: 3 });
    expect(res).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  test('returns false when no detail content', async () => {
    fetchSCDataByUrl.mockResolvedValue({ data: null });
    const res = await syncGalactapediaDetail({ api_url: 'url', id: 2 });
    expect(res).toBe(false);
  });
});
