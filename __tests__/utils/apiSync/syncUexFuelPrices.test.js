jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({ UexFuelPrice: { upsert: jest.fn() } }));

const { fetchUexData } = require('../../../utils/fetchUexData');
const { UexFuelPrice } = require('../../../config/database');
const { syncUexFuelPrices } = require('../../../utils/apiSync/syncUexFuelPrices');

describe('syncUexFuelPrices', () => {
  beforeEach(() => jest.clearAllMocks());

  test('upserts fuel prices', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 1, commodity_name: 'Fuel' }] });
    UexFuelPrice.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexFuelPrices();
    expect(fetchUexData).toHaveBeenCalledWith('fuel_prices_all');
    expect(UexFuelPrice.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 })
    );
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexFuelPrices()).rejects.toThrow('Expected an array of fuel price entries');
  });
});
