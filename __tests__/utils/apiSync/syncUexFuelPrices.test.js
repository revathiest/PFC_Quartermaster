jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({ UexFuelPrice: { upsert: jest.fn() } }));

const { fetchUexData } = require('../../../utils/fetchUexData');
const { UexFuelPrice } = require('../../../config/database');
const { syncUexFuelPrices } = require('../../../utils/apiSync/syncUexFuelPrices');

describe('syncUexFuelPrices', () => {
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

  test('upserts fuel prices', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 1, commodity_name: 'Fuel' }] });
    UexFuelPrice.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexFuelPrices();
    expect(fetchUexData).toHaveBeenCalledWith('fuel_prices_all');
    expect(UexFuelPrice.upsert).toHaveBeenCalled();
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('skips invalid entries', async () => {
    fetchUexData.mockResolvedValue({ data: [{}, { id: 2, commodity_name: 'Fuel' }] });
    UexFuelPrice.upsert.mockResolvedValue([{}, false]);

    const res = await syncUexFuelPrices();
    expect(warnSpy).toHaveBeenCalled();
    expect(res).toEqual({ created: 0, updated: 1, skipped: 1, total: 2 });
  });

  test('logs and rethrows on upsert error', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 3, commodity_name: 'f' }] });
    UexFuelPrice.upsert.mockRejectedValue(new Error('fail'));

    await expect(syncUexFuelPrices()).rejects.toThrow('fail');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexFuelPrices()).rejects.toThrow('Expected an array of fuel price entries');
    expect(errorSpy).toHaveBeenCalled();
  });
});
