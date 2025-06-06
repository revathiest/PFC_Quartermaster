const { getContent } = require('../../api/content');

jest.mock('../../config/database', () => ({ SiteContent: { findOne: jest.fn() } }));
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
