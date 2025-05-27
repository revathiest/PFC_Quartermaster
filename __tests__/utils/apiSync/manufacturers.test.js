jest.mock('../../../utils/fetchSCData', () => ({ fetchSCData: jest.fn() }));
jest.mock('../../../config/database', () => ({ Manufacturer: { upsert: jest.fn() } }));

const { fetchSCData } = require('../../../utils/fetchSCData');
const { Manufacturer } = require('../../../config/database');
const { syncManufacturers } = require('../../../utils/apiSync/manufacturers');

describe('syncManufacturers', () => {
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

  test('upserts manufacturers', async () => {
    fetchSCData.mockResolvedValue([{ code: 'MISC', name: 'misc', link: 'x' }]);
    Manufacturer.upsert.mockResolvedValue([{}, true]);

    const res = await syncManufacturers();
    expect(fetchSCData).toHaveBeenCalledWith('manufacturers');
    expect(Manufacturer.upsert).toHaveBeenCalledWith(expect.objectContaining({ code: 'MISC' }));
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('throws on invalid data', async () => {
    fetchSCData.mockResolvedValue(null);
    await expect(syncManufacturers()).rejects.toThrow('Expected an array of manufacturers');
    expect(errorSpy).toHaveBeenCalled();
  });
});
