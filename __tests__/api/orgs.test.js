jest.mock('../../config/database', () => ({
  OrgTag: { findAll: jest.fn() },
  Org: { findByPk: jest.fn() }
}));

const { listOrgs, getOrg } = require('../../api/orgs');
const { OrgTag, Org } = require('../../config/database');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

beforeEach(() => { jest.clearAllMocks(); });

describe('api/orgs listOrgs', () => {
  test('returns org data', async () => {
    OrgTag.findAll.mockResolvedValue([{ rsiOrgId: 'PFCS' }, { rsiOrgId: 'ABC' }]);
    Org.findByPk
      .mockResolvedValueOnce({ data: JSON.stringify({ name: 'PFC' }) })
      .mockResolvedValueOnce({ data: JSON.stringify({ name: 'A' }) });
    const req = {}; const res = mockRes();

    await listOrgs(req, res);

    expect(OrgTag.findAll).toHaveBeenCalled();
    expect(Org.findByPk).toHaveBeenCalledTimes(2);
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
    Org.findByPk.mockResolvedValue({ data: JSON.stringify({ name: 'PFC' }) });
    const req = { params: { sid: 'PFCS' } };
    const res = mockRes();

    await getOrg(req, res);

    expect(Org.findByPk).toHaveBeenCalledWith('PFCS');
    expect(res.json).toHaveBeenCalledWith({ org: { name: 'PFC' } });
  });

  test('returns 404 when not found', async () => {
    Org.findByPk.mockResolvedValue(null);
    const req = { params: { sid: 'XYZ' } };
    const res = mockRes();

    await getOrg(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  test('handles errors', async () => {
    const err = new Error('fail');
    Org.findByPk.mockRejectedValue(err);
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
