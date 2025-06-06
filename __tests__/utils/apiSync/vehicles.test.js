jest.mock('../../../utils/fetchSCData', () => ({ fetchSCData: jest.fn() }));
jest.mock('../../../config/database', () => ({ Vehicle: { upsert: jest.fn() } }));

const { fetchSCData } = require('../../../utils/fetchSCData');
const { Vehicle } = require('../../../config/database');
const { syncVehicles } = require('../../../utils/apiSync/vehicles');

describe('syncVehicles', () => {
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
    fetchSCData.mockResolvedValue([{ uuid: 'u1', name: 'ship' }]);
    Vehicle.upsert.mockResolvedValue([{}, true]);

    const res = await syncVehicles();
    expect(fetchSCData).toHaveBeenCalledWith('vehicles');
    expect(Vehicle.upsert).toHaveBeenCalledWith(expect.objectContaining({ uuid: 'u1' }));
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('skips entries without uuid', async () => {
    fetchSCData.mockResolvedValue([{ uuid: '', name: 'x' }, { uuid: 'u2', name: 'y' }]);
    Vehicle.upsert.mockResolvedValue([{}, false]);

    const res = await syncVehicles();
    expect(warnSpy).toHaveBeenCalled();
    expect(res).toEqual({ created: 0, updated: 1, skipped: 1, total: 2 });
  });

  test('logs and rethrows when upsert fails', async () => {
    fetchSCData.mockResolvedValue([{ uuid: 'u3', name: 'z' }]);
    Vehicle.upsert.mockRejectedValue(new Error('fail'));

    await expect(syncVehicles()).rejects.toThrow('fail');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('throws on invalid data', async () => {
    fetchSCData.mockResolvedValue(null);
    await expect(syncVehicles()).rejects.toThrow('Expected an array of vehicles');
    expect(errorSpy).toHaveBeenCalled();
  });
});
