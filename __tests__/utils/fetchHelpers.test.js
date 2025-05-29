const { fetchSCData } = require('../../utils/fetchSCData');
const { fetchUexData } = require('../../utils/fetchUexData');
const fetch = require('node-fetch');

jest.mock('node-fetch');

describe('fetch helpers', () => {
  let errorSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  describe('fetchSCData', () => {
    test('returns data on success', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 1 }], links: { next: null } })
      });
      const result = await fetchSCData('ships');
      expect(result).toEqual([{ id: 1 }]);
    });

    test('returns empty array on http error', async () => {
      fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'err' });
      const result = await fetchSCData('ships');
      expect(result).toEqual([]);
    });

    test('returns empty array on malformed json', async () => {
      fetch.mockResolvedValue({ ok: true, json: async () => ({}) });
      const result = await fetchSCData('ships');
      expect(result).toEqual([]);
    });

    test('returns empty array on network error', async () => {
      fetch.mockRejectedValue(new Error('net'));
      const result = await fetchSCData('ships');
      expect(result).toEqual([]);
    });
  });

  describe('fetchUexData', () => {
    test('returns json on success', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ foo: 'bar' })
      });
      const data = await fetchUexData('items');
      expect(data).toEqual({ foo: 'bar' });
    });

    test('returns empty object on http error', async () => {
      fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'fail' });
      const data = await fetchUexData('items');
      expect(data).toEqual({});
    });

    test('returns empty object on network error', async () => {
      fetch.mockRejectedValue(new Error('net'));
      const data = await fetchUexData('items');
      expect(data).toEqual({});
    });
  });
});
