const syncEndpoints = require('../../../botactions/api/syncEndpoints');
const { runFullApiSync } = require('../../../utils/apiSync/syncApiData');

jest.mock('../../../botactions/api/syncEndpoints', () => ({
  syncManufacturers: jest.fn().mockResolvedValue({}),
  syncUexTerminals: jest.fn().mockResolvedValue({}),
  syncVehicles: jest.fn().mockResolvedValue({}),
  syncGalactapedia: jest.fn().mockResolvedValue({}),
  syncUexVehicles: jest.fn().mockResolvedValue({}),
  syncUexItemPrices: jest.fn().mockResolvedValue({}),
  syncUexCategories: jest.fn().mockResolvedValue({}),
  syncUexCommodityPrices: jest.fn().mockResolvedValue({}),
  syncUexFuelPrices: jest.fn().mockResolvedValue({}),
  syncUexVehiclePurchasePrices: jest.fn().mockResolvedValue({}),
  syncUexVehicleRentalPrices: jest.fn().mockResolvedValue({}),
  syncUexPois: jest.fn().mockResolvedValue({}),
}));

describe('runFullApiSync', () => {
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test('calls all sync endpoints', async () => {
    const results = await runFullApiSync();
    for (const fn of Object.values(syncEndpoints)) {
      expect(fn).toHaveBeenCalled();
    }
    expect(results).toHaveProperty('Shops');
  });

  test('handles errors from an endpoint', async () => {
    syncEndpoints.syncVehicles.mockRejectedValueOnce(new Error('fail'));
    const results = await runFullApiSync();
    expect(results['Vehicles (wiki)']).toEqual({ error: true });
    expect(errorSpy).toHaveBeenCalled();
  });
});
