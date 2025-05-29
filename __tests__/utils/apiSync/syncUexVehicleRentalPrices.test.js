jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({ UexVehicleRentalPrice: { upsert: jest.fn() } }));

const { fetchUexData } = require('../../../utils/fetchUexData');
const { UexVehicleRentalPrice } = require('../../../config/database');
const { syncUexVehicleRentalPrices } = require('../../../utils/apiSync/syncUexVehicleRentalPrices');

describe('syncUexVehicleRentalPrices', () => {
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

  test('upserts vehicle rental prices', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 1, vehicle_name: 'ship', id_vehicle: 1, id_terminal: 1 }] });
    UexVehicleRentalPrice.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexVehicleRentalPrices();
    expect(fetchUexData).toHaveBeenCalledWith('vehicles_rentals_prices_all');
    expect(UexVehicleRentalPrice.upsert).toHaveBeenCalled();
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('skips invalid entries', async () => {
    fetchUexData.mockResolvedValue({ data: [{}, { id: 2, vehicle_name: 'ok', id_vehicle: 2, id_terminal: 1 }] });
    UexVehicleRentalPrice.upsert.mockResolvedValue([{}, false]);

    const res = await syncUexVehicleRentalPrices();
    expect(warnSpy).toHaveBeenCalled();
    expect(res).toEqual({ created: 0, updated: 1, skipped: 1, total: 2 });
  });

  test('logs and rethrows on upsert error', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 3, vehicle_name: 'x', id_vehicle: 3, id_terminal: 1 }] });
    UexVehicleRentalPrice.upsert.mockRejectedValue(new Error('fail'));

    await expect(syncUexVehicleRentalPrices()).rejects.toThrow('fail');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexVehicleRentalPrices()).rejects.toThrow('Expected an array of vehicle rental price entries');
    expect(errorSpy).toHaveBeenCalled();
  });
});
