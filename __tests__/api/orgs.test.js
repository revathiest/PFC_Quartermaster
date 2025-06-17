jest.mock('node-fetch');
jest.mock('../../config/database', () => ({ OrgTag: { findAll: jest.fn() } }));

const fetch = require('node-fetch');
const { listOrgs, getOrg } = require('../../api/orgs');
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

describe('api/orgs getOrg', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('returns org data', async () => {
    fetch.mockResolvedValue({ text: async () => JSON.stringify({ data: { name: 'PFC' } }) });
    const req = { params: { sid: 'PFCS' } };
    const res = mockRes();

    await getOrg(req, res);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('PFCS'));
    expect(res.json).toHaveBeenCalledWith({ org: { name: 'PFC' } });
  });

  test('returns 404 when not found', async () => {
    fetch.mockResolvedValue({ text: async () => JSON.stringify({}) });
    const req = { params: { sid: 'XYZ' } };
    const res = mockRes();

    await getOrg(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  test('handles errors', async () => {
    const err = new Error('fail');
    fetch.mockRejectedValue(err);
    const req = { params: { sid: 'PFCS' } };
    const res = mockRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getOrg(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });
});
