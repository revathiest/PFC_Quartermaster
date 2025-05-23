const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');
jest.mock('node-fetch');

const { fetchRsiProfileInfo } = require('../../utils/rsiProfileScraper');

describe('rsiProfileScraper - fetchRsiProfileInfo edge cases', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const validProfileHtml = `
    <html>
      <div class="account-profile">
        <div class="info">
          <p class="entry">
            <span class="label">Handle name</span>
            <strong class="value">KenHart</strong>
          </p>
        </div>
        <div class="thumb">
          <img src="/media/avatar.png" />
        </div>
      </div>

      <div class="left-col">
        <div class="inner">
          <p class="entry">
            <span class="label">Enlisted</span>
            <strong class="value">July 15, 2020</strong>
          </p>
        </div>
      </div>

      <div class="main-org">
        <div class="info">
          <p class="entry">
            <a class="value">Pyro Freelancer Corps</a>
          </p>
          <p class="entry">
            <span class="label">Spectrum Identification (SID)</span>
            <strong class="value">PFC</strong>
          </p>
          <p class="entry">
            <span class="label">Organization rank</span>
            <strong class="value">Fleet Admiral</strong>
          </p>
        </div>
      </div>

      <div class="right-col">
        <div class="entry bio">
          <span class="label">Bio</span>
          <div class="value">Flying free across the 'verse.</div>
        </div>
      </div>
    </html>
  `;

  it('parses fully populated profile correctly', async () => {
    fetch.mockResolvedValue(new Response(validProfileHtml, { status: 200 }));

    const expectedProfile = {
      handle: 'KenHart',
      avatar: 'https://robertsspaceindustries.com/media/avatar.png',
      enlisted: 'July 15, 2020',
      orgName: 'Pyro Freelancer Corps',
      orgId: 'PFC',
      orgRank: 'Fleet Admiral',
      bio: "Flying free across the 'verse."
    };

    const result = await fetchRsiProfileInfo('KenHart');
    expect(result).toEqual(expectedProfile);
  });

  it('handles missing avatar gracefully', async () => {
    const noAvatarHtml = validProfileHtml.replace(
      `<img src="/media/avatar.png" />`,
      ''
    );
    fetch.mockResolvedValue(new Response(noAvatarHtml, { status: 200 }));

    const result = await fetchRsiProfileInfo('NoAvatarUser');
    expect(result.avatar).toBeNull();
    expect(result.handle).toBe('KenHart');
    expect(result.orgName).toBe('Pyro Freelancer Corps');
  });

  it('handles bad avatar URL (non-https) gracefully', async () => {
    const badAvatarHtml = validProfileHtml.replace(
      `/media/avatar.png`,
      `javascript:void(0)`
    );
    fetch.mockResolvedValue(new Response(badAvatarHtml, { status: 200 }));

    const result = await fetchRsiProfileInfo('BadAvatarUser');
    expect(result.avatar).toBeNull(); // Because "javascript:void(0)" is NOT a valid URL
  });

  it('handles unaffiliated user (no org info)', async () => {
    const noOrgHtml = validProfileHtml.replace(
      /<div class="main-org">[\s\S]*?<\/div>/,
      `<div class="main-org right-col visibility-">
        <span class="title">Main organization </span>
        <div class="inner clearfix">
          <div class="empty">NO MAIN ORG FOUND IN PUBLIC RECORDS</div>
        </div>
        <span class="deco-separator top"></span>
        <span class="deco-separator bottom"></span>
      </div>`
    );

    fetch.mockResolvedValue(new Response(noOrgHtml, { status: 200 }));

    const result = await fetchRsiProfileInfo('UnaffiliatedUser');
    expect(result.orgName).toBe('');
    expect(result.orgId).toBeNull();
    expect(result.orgRank).toBeNull();
  });

  it('handles missing multiple fields gracefully', async () => {
    const halfBakedHtml = `
      <html>
        <div class="account-profile">
          <div class="info">
            <p class="entry">
              <span class="label">Handle name</span>
              <strong class="value">HalfBakedUser</strong>
            </p>
          </div>
          <div class="thumb"></div>
        </div>
        <!-- no enlisted, no bio, no org -->
      </html>
    `;

    fetch.mockResolvedValue(new Response(halfBakedHtml, { status: 200 }));

    const result = await fetchRsiProfileInfo('HalfBakedUser');
    expect(result.avatar).toBeNull();
    expect(result.bio).toBe('');
    expect(result.enlisted).toBe('');
    expect(result.orgName).toBe('');
    expect(result.orgId).toBeNull();
    expect(result.orgRank).toBeNull();
  });

  it('parses only orgId (SID) correctly when orgRank is missing', async () => {
    const orgIdOnlyHtml = `
      <html>
        <div class="account-profile">
          <div class="info">
            <p class="entry">
              <span class="label">Handle name</span>
              <strong class="value">SIDOnlyUser</strong>
            </p>
          </div>
        </div>
        <div class="main-org">
          <div class="info">
            <p class="entry">
              <span class="label">Spectrum Identification (SID)</span>
              <strong class="value">SID123</strong>
            </p>
          </div>
        </div>
      </html>
    `;

    fetch.mockResolvedValue(new Response(orgIdOnlyHtml, { status: 200 }));

    const result = await fetchRsiProfileInfo('SIDOnlyUser');
    expect(result.handle).toBe('SIDOnlyUser');
    expect(result.orgId).toBe('SID123');
    expect(result.orgRank).toBeNull();
  });

  it('throws an error with code PROFILE_NOT_FOUND if handle is not found (HTTP 404)', async () => {
    fetch.mockResolvedValue(new Response('Not Found', { status: 404 }));

    await expect(fetchRsiProfileInfo('NonExistentHandle'))
      .rejects
      .toMatchObject({ code: 'PROFILE_NOT_FOUND' });
  });

  it('throws an error if profile page structure is invalid (no handle found)', async () => {
    const badHtml = '<html><body>No useful content</body></html>';
    fetch.mockResolvedValue(new Response(badHtml, { status: 200 }));

    await expect(fetchRsiProfileInfo('KenHart'))
      .rejects
      .toThrow('Could not parse RSI profile for handle: KenHart');
  });
});
