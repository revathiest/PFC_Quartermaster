jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({ UexVehicle: { upsert: jest.fn() } }));

const { fetchUexData } = require('../../../utils/fetchUexData');
const { UexVehicle } = require('../../../config/database');
const { syncUexVehicles } = require('../../../utils/apiSync/syncUexVehicles');

describe('syncUexVehicles', () => {
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

  test('upserts vehicles', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 1, name: 'ship' }] });
    UexVehicle.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexVehicles();
    expect(fetchUexData).toHaveBeenCalledWith('vehicles');
    expect(UexVehicle.upsert).toHaveBeenCalled();
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('skips invalid entries', async () => {
    fetchUexData.mockResolvedValue({ data: [{}, { id: 2, name: 'ok' }] });
    UexVehicle.upsert.mockResolvedValue([{}, false]);

    const res = await syncUexVehicles();
    expect(warnSpy).toHaveBeenCalled();
    expect(res).toEqual({ created: 0, updated: 1, skipped: 1, total: 2 });
  });

  test('logs and rethrows on upsert failure', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 3, name: 'b' }] });
    UexVehicle.upsert.mockRejectedValue(new Error('fail'));

    await expect(syncUexVehicles()).rejects.toThrow('fail');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexVehicles()).rejects.toThrow('Expected an array of vehicles');
    expect(errorSpy).toHaveBeenCalled();
  });
});
