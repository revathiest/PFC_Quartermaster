const { fetchSCData, fetchSCDataByUrl } = require('../../utils/fetchSCData');
const fetch = require('node-fetch');

jest.mock('node-fetch');

describe('fetchSCData module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchSCData', () => {
    test('paginates through multiple pages using provided params', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: 1 }], links: { next: 'page2' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: 2 }], links: { next: null } })
        });

      const result = await fetchSCData('ships', { foo: 'bar', limit: 25 });

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        'https://api.star-citizen.wiki/api/v2/ships?foo=bar&limit=25&page=1'
      );
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        'https://api.star-citizen.wiki/api/v2/ships?foo=bar&limit=25&page=2'
      );
    });
  });

  describe('fetchSCDataByUrl', () => {
    test('returns parsed json on success', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const data = await fetchSCDataByUrl('https://u');

      expect(fetch).toHaveBeenCalledWith('https://u', {
        headers: { Accept: 'application/json' }
      });
      expect(data).toEqual({ success: true });
    });

    test('throws when response is not ok', async () => {
      fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'err' });

      await expect(fetchSCDataByUrl('https://bad')).rejects.toThrow(
        'Failed to fetch https://bad: 500 err'
      );
    });
  });
});
