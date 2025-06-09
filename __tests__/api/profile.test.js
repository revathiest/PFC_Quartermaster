jest.mock('../../config/database', () => ({ VerifiedUser: { findByPk: jest.fn() } }));
jest.mock('../../utils/rsiProfileScraper');
jest.mock('../../utils/discordProfile');

const { getProfile } = require('../../api/profile');
const { VerifiedUser } = require('../../config/database');
const { fetchRsiProfileInfo } = require('../../utils/rsiProfileScraper');
const { fetchDiscordProfileInfo } = require('../../utils/discordProfile');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe('api/profile getProfile', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('returns profile info', async () => {
    const req = { params: { userId: '1' } };
    const res = mockRes();
    VerifiedUser.findByPk.mockResolvedValue({ rsiHandle: 'Handle' });
    fetchRsiProfileInfo.mockResolvedValue({ handle: 'Handle', avatar: 'a' });
    fetchDiscordProfileInfo.mockResolvedValue({ username: 'user', avatar: 'd', roles: ['r'] });

    await getProfile(req, res);

    expect(VerifiedUser.findByPk).toHaveBeenCalledWith('1');
    expect(fetchRsiProfileInfo).toHaveBeenCalledWith('Handle');
    expect(fetchDiscordProfileInfo).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith({
      rsiProfile: { handle: 'Handle', avatar: 'a' },
      discordProfile: { username: 'user', avatar: 'd', roles: ['r'] }
    });
  });

  test('returns 404 when not found', async () => {
    const req = { params: { userId: 'x' } };
    const res = mockRes();
    VerifiedUser.findByPk.mockResolvedValue(null);

    await getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  test('handles errors', async () => {
    const req = { params: { userId: '1' } };
    const res = mockRes();
    VerifiedUser.findByPk.mockResolvedValue({ rsiHandle: 'Handle' });
    const err = new Error('fail');
    fetchRsiProfileInfo.mockRejectedValue(err);
    fetchDiscordProfileInfo.mockResolvedValue({});
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getProfile(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });

  test('handles discord fetch errors', async () => {
    const req = { params: { userId: '1' } };
    const res = mockRes();
    VerifiedUser.findByPk.mockResolvedValue({ rsiHandle: 'Handle' });
    fetchRsiProfileInfo.mockResolvedValue({});
    fetchDiscordProfileInfo.mockRejectedValue(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getProfile(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });
});
