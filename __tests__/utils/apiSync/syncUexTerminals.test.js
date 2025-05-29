jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({ UexTerminal: { upsert: jest.fn() } }));

const { fetchUexData } = require('../../../utils/fetchUexData');
const { UexTerminal } = require('../../../config/database');
const { syncUexTerminals } = require('../../../utils/apiSync/syncUexTerminals');

describe('syncUexTerminals', () => {
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

  test('upserts terminals', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 1, name: 'T' }] });
    UexTerminal.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexTerminals();
    expect(fetchUexData).toHaveBeenCalledWith('terminals');
    expect(UexTerminal.upsert).toHaveBeenCalled();
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('skips invalid entries', async () => {
    fetchUexData.mockResolvedValue({ data: [{}, { id: 2, name: 'ok' }] });
    UexTerminal.upsert.mockResolvedValue([{}, false]);

    const res = await syncUexTerminals();
    expect(warnSpy).toHaveBeenCalled();
    expect(res).toEqual({ created: 0, updated: 1, skipped: 1, total: 2 });
  });

  test('logs and rethrows on upsert failure', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 3, name: 'b' }] });
    UexTerminal.upsert.mockRejectedValue(new Error('fail'));

    await expect(syncUexTerminals()).rejects.toThrow('fail');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexTerminals()).rejects.toThrow('Expected an array of terminals');
    expect(errorSpy).toHaveBeenCalled();
  });
});
