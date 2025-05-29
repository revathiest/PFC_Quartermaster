jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({ UexPoi: { upsert: jest.fn() } }));

const { fetchUexData } = require('../../../utils/fetchUexData');
const { UexPoi } = require('../../../config/database');
const { syncUexPois } = require('../../../utils/apiSync/syncUexPoi');

describe('syncUexPois', () => {
  let errorSpy, warnSpy, logSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  test('upserts pois', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 1, name: 'poi' }] });
    UexPoi.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexPois();
    expect(fetchUexData).toHaveBeenCalledWith('poi');
    expect(UexPoi.upsert).toHaveBeenCalled();
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexPois()).rejects.toThrow('Expected an array of POIs');
    expect(errorSpy).toHaveBeenCalled();
  });
});
