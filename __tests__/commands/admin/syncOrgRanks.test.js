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

beforeEach(() => jest.clearAllMocks());

describe('/sync-org-ranks command', () => {
  test('reports mismatches', async () => {
    const interaction = makeInteraction();
    VerifiedUser.findAll.mockResolvedValue([{ rsiHandle: 'foo', discordUserId: 'id1', rsiOrgId: 'PFCS' }]);
    fetchRsiProfileInfo.mockResolvedValue({ orgId: 'PFCS', orgRank: 'Admiral' });

    await execute(interaction);

    expect(fetchRsiProfileInfo).toHaveBeenCalledWith('foo');
    expect(interaction.editReply).toHaveBeenCalledWith(expect.any(String));
  });
});
