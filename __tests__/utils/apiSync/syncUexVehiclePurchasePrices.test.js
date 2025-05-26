jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({ UexVehiclePurchasePrice: { upsert: jest.fn() } }));

const { fetchUexData } = require('../../../utils/fetchUexData');
const { UexVehiclePurchasePrice } = require('../../../config/database');
const { syncUexVehiclePurchasePrices } = require('../../../utils/apiSync/syncUexVehiclePurchasePrices');

describe('syncUexVehiclePurchasePrices', () => {
  beforeEach(() => jest.clearAllMocks());

  test('upserts vehicle purchase prices', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 1, vehicle_name: 'ship', id_vehicle: 1, id_terminal: 1 }] });
    UexVehiclePurchasePrice.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexVehiclePurchasePrices();
    expect(fetchUexData).toHaveBeenCalledWith('vehicles_purchases_prices_all');
    expect(UexVehiclePurchasePrice.upsert).toHaveBeenCalled();
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexVehiclePurchasePrices()).rejects.toThrow('Expected an array of vehicle purchase price entries');
  });
});
