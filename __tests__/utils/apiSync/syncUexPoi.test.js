jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({ UexPoi: { upsert: jest.fn() } }));

const { fetchUexData } = require('../../../utils/fetchUexData');
const { UexPoi } = require('../../../config/database');
const { syncUexPois } = require('../../../utils/apiSync/syncUexPoi');

describe('syncUexPois', () => {
  beforeEach(() => jest.clearAllMocks());

  test('upserts pois', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 1, name: 'poi' }] });
    UexPoi.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexPois();
    expect(fetchUexData).toHaveBeenCalledWith('poi');
    expect(UexPoi.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexPois()).rejects.toThrow('Expected an array of POIs');
  });
});
