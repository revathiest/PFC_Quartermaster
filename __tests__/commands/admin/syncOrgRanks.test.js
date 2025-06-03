jest.mock('../../../config/database', () => require('../../../__mocks__/config/database'));
jest.mock('../../../utils/rsiProfileScraper');

const { execute } = require('../../../commands/admin/syncOrgRanks');
const { VerifiedUser } = require('../../../config/database');
const { fetchRsiProfileInfo } = require('../../../utils/rsiProfileScraper');

const makeInteraction = () => ({
  deferReply: jest.fn(),
  editReply: jest.fn(),
  guild: {
    members: {
      fetch: jest.fn(() => Promise.resolve({
        roles: { cache: { map: fn => ['captain'].map(n => fn({ name: n })) } },
        user: { tag: 'user#1' }
      }))
    }
  }
});

let warnSpy;
let errorSpy;

beforeEach(() => {
  jest.clearAllMocks();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

describe('/sync-org-ranks command', () => {
  test('reports mismatches', async () => {
    const interaction = makeInteraction();
    VerifiedUser.findAll.mockResolvedValue([{ rsiHandle: 'foo', discordUserId: 'id1', rsiOrgId: 'PFCS' }]);
    fetchRsiProfileInfo.mockResolvedValue({ orgId: 'PFCS', orgRank: 'Admiral' });

    await execute(interaction);

    expect(fetchRsiProfileInfo).toHaveBeenCalledWith('foo');
    expect(interaction.editReply).toHaveBeenCalledWith(expect.any(String));
  });

  test('handles no PFCS members found', async () => {
    const interaction = makeInteraction();
    VerifiedUser.findAll.mockResolvedValue([]);

    await execute(interaction);

    expect(interaction.editReply).toHaveBeenCalledWith('No verified PFCS members found.');
  });

  test('returns success when roles match', async () => {
    const interaction = makeInteraction();
    VerifiedUser.findAll.mockResolvedValue([{ rsiHandle: 'foo', discordUserId: 'id1', rsiOrgId: 'PFCS' }]);
    fetchRsiProfileInfo.mockResolvedValue({ orgId: 'PFCS', orgRank: 'captain' });

    await execute(interaction);

    expect(interaction.editReply).toHaveBeenCalledWith(expect.stringContaining('All verified PFCS members'));
  });

  test('continues on profile fetch error', async () => {
    const interaction = makeInteraction();
    VerifiedUser.findAll.mockResolvedValue([{ rsiHandle: 'foo', discordUserId: 'id1', rsiOrgId: 'PFCS' }]);
    fetchRsiProfileInfo.mockRejectedValue(new Error('fail'));

    await execute(interaction);

    expect(fetchRsiProfileInfo).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalled();
  });

  test('handles member fetch error gracefully', async () => {
    const interaction = makeInteraction();
    interaction.guild.members.fetch.mockRejectedValue(new Error('missing'));
    VerifiedUser.findAll.mockResolvedValue([{ rsiHandle: 'foo', discordUserId: 'id1', rsiOrgId: 'PFCS' }]);
    fetchRsiProfileInfo.mockResolvedValue({ orgId: 'PFCS', orgRank: 'captain' });

    await execute(interaction);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch Discord member'));
    expect(interaction.editReply).toHaveBeenCalledWith(expect.stringContaining('All verified PFCS members'));
  });
});
