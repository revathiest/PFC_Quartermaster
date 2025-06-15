jest.mock('../../discordClient', () => ({ getClient: jest.fn() }));
jest.mock('../../config/database', () => ({ OfficerBio: { findByPk: jest.fn() } }));
jest.mock('../../config.json', () => ({ guildId: 'g1' }), { virtual: true });

const { listOfficers } = require('../../api/officers');
const { getClient } = require('../../discordClient');
const { OfficerBio } = require('../../config/database');
const { PermissionFlagsBits } = require('discord.js');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

const makeCollection = arr => ({
  filter: fn => makeCollection(arr.filter(fn)),
  map: fn => arr.map(fn),
  sort: fn => makeCollection(arr.sort(fn)),
  first: function() { return arr[0]; }
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('api/officers listOfficers', () => {
  test('returns officers with bios', async () => {
    const role = { name: 'Officer', permissions: { has: () => true }, hexColor: '#fff', position: 1 };
    const members = [
      { id: '1', user: { username: 'A' }, displayName: 'A', permissions: { has: perm => perm === PermissionFlagsBits.KickMembers }, roles: { cache: makeCollection([role]) } },
      { id: '2', user: { username: 'B' }, displayName: 'B', permissions: { has: () => false }, roles: { cache: makeCollection([]) } }
    ];
    const guild = { members: { fetch: jest.fn().mockResolvedValue(), cache: makeCollection(members) } };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } } });
    OfficerBio.findByPk.mockResolvedValue({ bio: 'hi' });
    const req = {}; const res = mockRes();

    await listOfficers(req, res);

    expect(guild.members.fetch).toHaveBeenCalled();
    expect(OfficerBio.findByPk).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith({ officers: [
      { userId: '1', username: 'A', displayName: 'A', roleName: 'Officer', roleColor: '#fff', bio: 'hi' }
    ] });
  });

  test('handles errors gracefully', async () => {
    const guild = { members: { fetch: jest.fn().mockRejectedValue(new Error('fail')), cache: makeCollection([]) } };
    getClient.mockReturnValue({ guilds: { cache: { get: jest.fn(() => guild) } } });
    const req = {}; const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listOfficers(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });

  test('returns 500 when client missing', async () => {
    getClient.mockReturnValue(null);
    const req = {}; const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listOfficers(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Discord client unavailable' });
    spy.mockRestore();
  });
});
