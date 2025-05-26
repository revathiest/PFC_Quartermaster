jest.mock('../../../utils/fetchUexData', () => ({ fetchUexData: jest.fn() }));
jest.mock('../../../config/database', () => ({ UexTerminal: { upsert: jest.fn() } }));

const { fetchUexData } = require('../../../utils/fetchUexData');
const { UexTerminal } = require('../../../config/database');
const { syncUexTerminals } = require('../../../utils/apiSync/syncUexTerminals');

describe('syncUexTerminals', () => {
  beforeEach(() => jest.clearAllMocks());

  test('upserts terminals', async () => {
    fetchUexData.mockResolvedValue({ data: [{ id: 1, name: 'T' }] });
    UexTerminal.upsert.mockResolvedValue([{}, true]);

    const res = await syncUexTerminals();
    expect(fetchUexData).toHaveBeenCalledWith('terminals');
    expect(UexTerminal.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('throws on invalid data', async () => {
    fetchUexData.mockResolvedValue({});
    await expect(syncUexTerminals()).rejects.toThrow('Expected an array of terminals');
  });
});
