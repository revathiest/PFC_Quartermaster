jest.mock('node-fetch');
jest.mock('../../config/database', () => ({ OrgTag: { findAll: jest.fn() } }));

const fetch = require('node-fetch');
const { listOrgs } = require('../../api/orgs');
const { OrgTag } = require('../../config/database');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

beforeEach(() => { jest.clearAllMocks(); });

describe('api/orgs listOrgs', () => {
  test('returns org data', async () => {
    OrgTag.findAll.mockResolvedValue([{ rsiOrgId: 'PFCS' }, { rsiOrgId: 'ABC' }]);
    fetch
      .mockResolvedValueOnce({ text: async () => JSON.stringify({ data: { name: 'PFC' } }) })
      .mockResolvedValueOnce({ text: async () => JSON.stringify({ data: { name: 'A' } }) });
    const req = {}; const res = mockRes();

    await listOrgs(req, res);

    expect(OrgTag.findAll).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({ orgs: [
      { name: 'PFC' },
      { name: 'A' }
    ] });
  });

  test('handles db errors', async () => {
    const err = new Error('fail');
    OrgTag.findAll.mockRejectedValue(err);
    const req = {}; const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listOrgs(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });
});
