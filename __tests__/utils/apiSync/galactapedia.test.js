jest.mock('../../../utils/fetchSCData', () => ({ fetchSCData: jest.fn() }));
jest.mock('../../../config/database', () => ({ GalactapediaEntry: { upsert: jest.fn() } }));

const { fetchSCData } = require('../../../utils/fetchSCData');
const { GalactapediaEntry } = require('../../../config/database');
const { syncGalactapedia } = require('../../../utils/apiSync/galactapedia');

describe('syncGalactapedia', () => {
  let errorSpy, warnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  test('upserts entries', async () => {
    fetchSCData.mockResolvedValue([{ id: 1, title: 'A', slug: 'a' }]);
    GalactapediaEntry.upsert.mockResolvedValue([{}, true]);

    const res = await syncGalactapedia();
    expect(fetchSCData).toHaveBeenCalledWith('galactapedia');
    expect(GalactapediaEntry.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('throws on invalid data', async () => {
    fetchSCData.mockResolvedValue(null);
    await expect(syncGalactapedia()).rejects.toThrow('Expected an array of Galactapedia entries');
    expect(errorSpy).toHaveBeenCalled();
  });
});
