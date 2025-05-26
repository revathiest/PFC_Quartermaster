jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({
  UexItemPrice: { upsert: jest.fn() },
  UexTerminal: { findByPk: jest.fn().mockResolvedValue(true) }
}));

const { fetchUexData } = require('../../../utils/fetchUexData');
const db = require('../../../config/database');
const { syncUexItemPrices } = require('../../../utils/apiSync/syncUexItemPrices');

describe('syncUexItemPrices', () => {
  beforeEach(() => jest.clearAllMocks());

  test('upserts item prices', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 1, item_name: 'Foo', id_terminal: 3 }] });
    db.UexItemPrice.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexItemPrices();
    expect(fetchUexData).toHaveBeenCalledWith('items_prices_all');
    expect(db.UexItemPrice.upsert).toHaveBeenCalled();
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexItemPrices()).rejects.toThrow('Expected an array of item prices');
  });
});
