jest.mock('../../../utils/fetchSCData', () => ({ fetchSCData: jest.fn() }));
jest.mock('../../../config/database', () => ({ Vehicle: { upsert: jest.fn() } }));

const { fetchSCData } = require('../../../utils/fetchSCData');
const { Vehicle } = require('../../../config/database');
const { syncVehicles } = require('../../../utils/apiSync/vehicles');

describe('syncVehicles', () => {
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

  test('upserts vehicles', async () => {
    fetchSCData.mockResolvedValue([{ uuid: 'u1', name: 'ship' }]);
    Vehicle.upsert.mockResolvedValue([{}, true]);

    const res = await syncVehicles();
    expect(fetchSCData).toHaveBeenCalledWith('vehicles');
    expect(Vehicle.upsert).toHaveBeenCalledWith(expect.objectContaining({ uuid: 'u1' }));
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('throws on invalid data', async () => {
    fetchSCData.mockResolvedValue(null);
    await expect(syncVehicles()).rejects.toThrow('Expected an array of vehicles');
    expect(errorSpy).toHaveBeenCalled();
  });
});
