jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({ UexVehicle: { upsert: jest.fn() } }));

const { fetchUexData } = require('../../../utils/fetchUexData');
const { UexVehicle } = require('../../../config/database');
const { syncUexVehicles } = require('../../../utils/apiSync/syncUexVehicles');

describe('syncUexVehicles', () => {
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
    fetchUexData.mockResolvedValue({ data: [{ id: 1, name: 'ship' }] });
    UexVehicle.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexVehicles();
    expect(fetchUexData).toHaveBeenCalledWith('vehicles');
    expect(UexVehicle.upsert).toHaveBeenCalled();
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexVehicles()).rejects.toThrow('Expected an array of vehicles');
    expect(errorSpy).toHaveBeenCalled();
  });
});
