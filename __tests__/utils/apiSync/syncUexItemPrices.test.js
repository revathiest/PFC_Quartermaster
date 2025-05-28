jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({
  UexItemPrice: { upsert: jest.fn() },
  UexTerminal: { findByPk: jest.fn().mockResolvedValue(true) }
}));

const { fetchUexData } = require('../../../utils/fetchUexData');
const db = require('../../../config/database');
const { syncUexItemPrices } = require('../../../utils/apiSync/syncUexItemPrices');

describe('syncUexItemPrices', () => {
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
    expect(errorSpy).toHaveBeenCalled();
  });

  test('skips entry missing fields', async () => {
    fetchUexData.mockResolvedValue({ data: [{ item_name: 'MissingId', id_terminal: 1 }] });

    const res = await syncUexItemPrices();
    expect(db.UexItemPrice.upsert).not.toHaveBeenCalled();
    expect(res).toEqual({ created: 0, updated: 0, skipped: 1, total: 1 });
    expect(warnSpy).toHaveBeenCalled();
  });

  test('skips entry when terminal missing', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 2, item_name: 'Foo', id_terminal: 9 }] });
    db.UexTerminal.findByPk.mockResolvedValueOnce(null);

    const res = await syncUexItemPrices();
    expect(db.UexItemPrice.upsert).not.toHaveBeenCalled();
    expect(res).toEqual({ created: 0, updated: 0, skipped: 1, total: 1 });
    expect(warnSpy).toHaveBeenCalled();
  });

  test('skips entry on FK error', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 3, item_name: 'Foo', id_terminal: 1 }] });
    const err = new Error('fk');
    err.name = 'SequelizeForeignKeyConstraintError';
    err.fields = ['id_terminal'];
    db.UexItemPrice.upsert.mockRejectedValueOnce(err);

    const res = await syncUexItemPrices();
    expect(res).toEqual({ created: 0, updated: 0, skipped: 1, total: 1 });
    expect(warnSpy).toHaveBeenCalled();
  });

  test('throws on unexpected upsert error', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 4, item_name: 'Foo', id_terminal: 1 }] });
    db.UexItemPrice.upsert.mockRejectedValueOnce(new Error('db'));

    await expect(syncUexItemPrices()).rejects.toThrow('db');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('propagates fetch errors', async () => {
    fetchUexData.mockRejectedValueOnce(new Error('net'));
    await expect(syncUexItemPrices()).rejects.toThrow('net');
    expect(errorSpy).toHaveBeenCalled();
  });
});
