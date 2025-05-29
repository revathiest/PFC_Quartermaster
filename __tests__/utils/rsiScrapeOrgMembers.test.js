const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');
jest.mock('node-fetch');

const rsiScrapeOrgMembers = require('../../utils/rsiScrapeOrgMembers');

describe('rsiScrapeOrgMembers', () => {
  let errorSpy;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    errorSpy.mockRestore();
  });

  test('collects members across pages', async () => {
    const page1 = `
      <div class="member-item"><div class="name-wrap"><span class="nick">User1</span></div><span class="rank">Recruit</span></div>
      <div class="member-item"><div class="name-wrap"><span class="nick">User2</span></div><span class="rank">Scout</span></div>
    `;
    fetch
      .mockResolvedValueOnce(new Response(page1, { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 200 }));

    const result = await rsiScrapeOrgMembers('PFC');
    expect(result).toEqual({
      members: [
        { handle: 'User1', rank: 'Recruit' },
        { handle: 'User2', rank: 'Scout' }
      ],
      redactedCount: 0
    });
  });

  test('throws on http error', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'err' });
    await expect(rsiScrapeOrgMembers('PFC')).rejects.toThrow('Failed to fetch page 1');
    expect(errorSpy).toHaveBeenCalled();
  });
});
