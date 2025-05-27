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
  beforeEach(() => jest.clearAllMocks());

  test('saves details and related data', async () => {
    fetchSCDataByUrl.mockResolvedValue({ data: { id: 1, translations: { en_EN: 'text' }, tags: [], properties: [], related_articles: [] } });

    const res = await syncGalactapediaDetail({ api_url: 'url', id: 1 });
    expect(fetchSCDataByUrl).toHaveBeenCalledWith('url');
    expect(db.GalactapediaDetail.upsert).toHaveBeenCalled();
    expect(res).toBe(true);
  });

  test('returns false when no detail content', async () => {
    fetchSCDataByUrl.mockResolvedValue({ data: null });
    const res = await syncGalactapediaDetail({ api_url: 'url', id: 2 });
    expect(res).toBe(false);
  });
});
