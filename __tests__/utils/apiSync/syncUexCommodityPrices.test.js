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
});
