jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({ UexCategory: { upsert: jest.fn() } }));

const { fetchUexData } = require('../../../utils/fetchUexData');
const { UexCategory } = require('../../../config/database');
const { syncUexCategories } = require('../../../utils/apiSync/syncUexCategories');

describe('syncUexCategories', () => {
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

  test('upserts categories', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 1, name: 'C' }] });
    UexCategory.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexCategories();
    expect(fetchUexData).toHaveBeenCalledWith('categories');
    expect(UexCategory.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexCategories()).rejects.toThrow('Expected an array of categories');
    expect(errorSpy).toHaveBeenCalled();
  });
});
