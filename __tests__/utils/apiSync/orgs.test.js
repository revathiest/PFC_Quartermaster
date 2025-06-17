jest.mock('../../../config/database', () => ({
  OrgTag: { findAll: jest.fn() },
  Org: { upsert: jest.fn() }
}));
jest.mock('node-fetch');

const fetch = require('node-fetch');
const { OrgTag, Org } = require('../../../config/database');
const { syncOrgs } = require('../../../utils/apiSync/orgs');

describe('syncOrgs', () => {
  let logSpy, errorSpy, warnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  test('upserts orgs', async () => {
    OrgTag.findAll.mockResolvedValue([{ rsiOrgId: 'PFCS' }]);
    fetch.mockResolvedValue({ text: async () => JSON.stringify({ data: { id: 1 } }) });
    Org.upsert.mockResolvedValue([{}, true]);

    const res = await syncOrgs();
    expect(fetch).toHaveBeenCalled();
    expect(Org.upsert).toHaveBeenCalledWith({ rsiOrgId: 'PFCS', data: expect.any(String) });
    expect(res).toEqual({ created: 1, updated: 0, skipped: 0, total: 1 });
  });

  test('skips entries without data', async () => {
    OrgTag.findAll.mockResolvedValue([{ rsiOrgId: 'PFCS' }]);
    fetch.mockResolvedValue({ text: async () => JSON.stringify({}) });

    const res = await syncOrgs();
    expect(warnSpy).toHaveBeenCalled();
    expect(Org.upsert).not.toHaveBeenCalled();
    expect(res).toEqual({ created: 0, updated: 0, skipped: 1, total: 1 });
  });

  test('throws when upsert fails', async () => {
    OrgTag.findAll.mockResolvedValue([{ rsiOrgId: 'PFCS' }]);
    fetch.mockResolvedValue({ text: async () => JSON.stringify({ data: { id: 1 } }) });
    Org.upsert.mockRejectedValue(new Error('fail'));

    await expect(syncOrgs()).rejects.toThrow('fail');
    expect(errorSpy).toHaveBeenCalled();
  });

  test('throws on fetch error', async () => {
    OrgTag.findAll.mockResolvedValue([{ rsiOrgId: 'PFCS' }]);
    fetch.mockRejectedValue(new Error('fail'));

    await expect(syncOrgs()).rejects.toThrow('fail');
    expect(errorSpy).toHaveBeenCalled();
  });
});
