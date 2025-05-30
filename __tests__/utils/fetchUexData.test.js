const { fetchUexData } = require('../../utils/fetchUexData');
const fetch = require('node-fetch');

jest.mock('node-fetch');

describe('fetchUexData', () => {
  let errorSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.UEX_API_TOKEN = 'token';
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test('returns json when request succeeds', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    const data = await fetchUexData('vehicles');

    expect(fetch).toHaveBeenCalledWith('https://api.uexcorp.space/2.0/vehicles', {
      headers: { Authorization: 'Bearer token', Accept: 'application/json' }
    });
    expect(data).toEqual({ success: true });
  });

  test('logs and returns empty object on http failure', async () => {
    fetch.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

    const data = await fetchUexData('missing');

    expect(data).toEqual({});
    expect(errorSpy).toHaveBeenCalledWith(
      '[UEX FETCH ERROR] Failed to fetch https://api.uexcorp.space/2.0/missing: 404 Not Found'
    );
  });

  test('logs and returns empty object on network error', async () => {
    fetch.mockRejectedValue(new Error('bad'));

    const data = await fetchUexData('bad');

    expect(data).toEqual({});
    expect(errorSpy).toHaveBeenCalledWith('[UEX FETCH ERROR] bad');
  });
});
