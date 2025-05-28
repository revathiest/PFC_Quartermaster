jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({
  UexCommodityPrice: { upsert: jest.fn() },
  UexTerminal: { findByPk: jest.fn().mockResolvedValue(true) }
}));

const { fetchUexData } = require('../../../utils/fetchUexData');
const db = require('../../../config/database');
const { syncUexCommodityPrices } = require('../../../utils/apiSync/syncUexCommodityPrices');

describe('syncUexCommodityPrices', () => {
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

  test('upserts commodity prices', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 1, commodity_name: 'X', id_terminal: 2 }] });
    db.UexCommodityPrice.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexCommodityPrices();
    expect(fetchUexData).toHaveBeenCalledWith('commodities_prices_all');
    expect(db.UexCommodityPrice.upsert).toHaveBeenCalled();
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexCommodityPrices()).rejects.toThrow('Expected an array of commodity price entries');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('skips entry missing fields', async () => {
    fetchUexData.mockResolvedValue({ data: [{ commodity_name: 'MissingId', id_terminal: 1 }] });

    const res = await syncUexCommodityPrices();
    expect(db.UexCommodityPrice.upsert).not.toHaveBeenCalled();
    expect(res).toEqual({ created: 0, updated: 0, skipped: 1, total: 1 });
    expect(warnSpy).toHaveBeenCalled();
  });

  test('skips entry when terminal not found', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 2, commodity_name: 'X', id_terminal: 99 }] });
    db.UexTerminal.findByPk.mockResolvedValueOnce(null);

    const res = await syncUexCommodityPrices();
    expect(db.UexCommodityPrice.upsert).not.toHaveBeenCalled();
    expect(res).toEqual({ created: 0, updated: 0, skipped: 1, total: 1 });
    expect(warnSpy).toHaveBeenCalled();
  });

  test('skips entry on FK error', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 3, commodity_name: 'X', id_terminal: 2 }] });
    const err = new Error('fk');
    err.name = 'SequelizeForeignKeyConstraintError';
    err.fields = ['id_terminal'];
    db.UexCommodityPrice.upsert.mockRejectedValueOnce(err);

    const res = await syncUexCommodityPrices();
    expect(res).toEqual({ created: 0, updated: 0, skipped: 1, total: 1 });
    expect(warnSpy).toHaveBeenCalled();
  });

  test('throws on unexpected upsert error', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 4, commodity_name: 'X', id_terminal: 2 }] });
    db.UexCommodityPrice.upsert.mockRejectedValueOnce(new Error('db'));

    await expect(syncUexCommodityPrices()).rejects.toThrow('db');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('propagates fetch errors', async () => {
    fetchUexData.mockRejectedValueOnce(new Error('network'));
    await expect(syncUexCommodityPrices()).rejects.toThrow('network');
    expect(errorSpy).toHaveBeenCalled();
  });
});
