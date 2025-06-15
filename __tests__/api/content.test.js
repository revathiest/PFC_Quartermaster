jest.mock('../../config/database', () => ({ SiteContent: { findOne: jest.fn(), findAll: jest.fn(), update: jest.fn() } }));
const { getContent, listSections, updateContent } = require('../../api/content');
const { SiteContent } = require('../../config/database');

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('api/content getContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns content when found', async () => {
    const req = { params: { section: 'about' } };
    const res = mockRes();
    SiteContent.findOne.mockResolvedValue({ content: 'hello' });

    await getContent(req, res);
    expect(SiteContent.findOne).toHaveBeenCalledWith({ where: { section: 'about' } });
    expect(res.json).toHaveBeenCalledWith({ content: 'hello' });
  });

  test('returns 404 when not found', async () => {
    const req = { params: { section: 'missing' } };
    const res = mockRes();
    SiteContent.findOne.mockResolvedValue(null);

    await getContent(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  test('handles errors', async () => {
    const req = { params: { section: 'x' } };
    const res = mockRes();
    const err = new Error('fail');
    SiteContent.findOne.mockRejectedValue(err);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getContent(req, res);
    expect(errorSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    errorSpy.mockRestore();
  });
});

describe('api/content listSections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns section list', async () => {
    const req = {};
    const res = mockRes();
    SiteContent.findAll.mockResolvedValue([{ section: 'about' }, { section: 'faq' }]);

    await listSections(req, res);
    expect(SiteContent.findAll).toHaveBeenCalledWith({ attributes: ['section'] });
    expect(res.json).toHaveBeenCalledWith({ sections: ['about', 'faq'] });
  });

  test('handles errors', async () => {
    const req = {};
    const res = mockRes();
    const err = new Error('fail');
    SiteContent.findAll.mockRejectedValue(err);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listSections(req, res);
    expect(errorSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    errorSpy.mockRestore();
  });
});

describe('api/content updateContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updates content successfully', async () => {
    const req = { params: { section: 'about' }, body: { content: 'new' } };
    const res = mockRes();
    SiteContent.update.mockResolvedValue([1]);

    await updateContent(req, res);

    expect(SiteContent.update).toHaveBeenCalledWith({ content: 'new' }, { where: { section: 'about' } });
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test('returns 400 when missing content', async () => {
    const req = { params: { section: 'about' }, body: {} };
    const res = mockRes();

    await updateContent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing content' });
  });

  test('returns 404 when section missing', async () => {
    const req = { params: { section: 'x' }, body: { content: 'hi' } };
    const res = mockRes();
    SiteContent.update.mockResolvedValue([0]);

    await updateContent(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  test('handles errors', async () => {
    const req = { params: { section: 'x' }, body: { content: 'hi' } };
    const res = mockRes();
    const err = new Error('fail');
    SiteContent.update.mockRejectedValue(err);
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await updateContent(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });
});
