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

  test('skips entries missing code and counts update', async () => {
    fetchSCData.mockResolvedValue([{ code: '', name: 'x' }, { code: 'GOOD', name: 'n' }]);
    Manufacturer.upsert.mockResolvedValue([{}, false]);

    const res = await syncManufacturers();
    expect(warnSpy).toHaveBeenCalled();
    expect(res).toEqual({ created: 0, updated: 1, skipped: 1, total: 2 });
  });

  test('logs and rethrows on upsert failure', async () => {
    fetchSCData.mockResolvedValue([{ code: 'BOOM', name: 'b' }]);
    Manufacturer.upsert.mockRejectedValue(new Error('fail'));

    await expect(syncManufacturers()).rejects.toThrow('fail');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('throws on invalid data', async () => {
    fetchSCData.mockResolvedValue(null);
    await expect(syncManufacturers()).rejects.toThrow('Expected an array of manufacturers');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('skips entries missing code', async () => {
    fetchSCData.mockResolvedValue([
      { name: 'Unknown', link: 'y' },
      { code: 'MISC', name: 'misc', link: 'x' }
    ]);
    Manufacturer.upsert.mockResolvedValue([{}, true]);

    const res = await syncManufacturers();
    expect(warnSpy).toHaveBeenCalled();
    expect(Manufacturer.upsert).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ created: 1, updated: 0, skipped: 1, total: 2 });
  });

  test('counts updates when upsert not creating', async () => {
    fetchSCData.mockResolvedValue([{ code: 'MISC', name: 'misc', link: 'x' }]);
    Manufacturer.upsert.mockResolvedValue([{}, false]);

    const res = await syncManufacturers();
    expect(res).toEqual({ created: 0, updated: 1, skipped: 0, total: 1 });
  });

  test('propagates fetch errors', async () => {
    fetchSCData.mockRejectedValue(new Error('fail'));
    await expect(syncManufacturers()).rejects.toThrow('fail');
    expect(errorSpy).toHaveBeenCalled();
  });
});
