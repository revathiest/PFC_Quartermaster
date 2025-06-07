jest.mock('../../config/database', () => ({ Event: { findAll: jest.fn(), findByPk: jest.fn() } }));
const { listEvents, getEvent } = require('../../api/events');
const { Event } = require('../../config/database');

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('api/events listEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns event list', async () => {
    const req = {};
    const res = mockRes();
    Event.findAll.mockResolvedValue([{ event_id: 1 }]);

    await listEvents(req, res);
    expect(Event.findAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ events: [{ event_id: 1 }] });
  });

  test('handles errors', async () => {
    const req = {};
    const res = mockRes();
    const err = new Error('fail');
    Event.findAll.mockRejectedValue(err);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await listEvents(req, res);
    expect(errorSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    errorSpy.mockRestore();
  });
});

describe('api/events getEvent', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('returns single event', async () => {
    const req = { params: { id: '1' } };
    const res = mockRes();
    Event.findByPk.mockResolvedValue({ event_id: 1 });

    await getEvent(req, res);
    expect(Event.findByPk).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith({ event: { event_id: 1 } });
  });

  test('returns 404 when not found', async () => {
    const req = { params: { id: '2' } };
    const res = mockRes();
    Event.findByPk.mockResolvedValue(null);

    await getEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  test('handles errors', async () => {
    const req = { params: { id: '3' } };
    const res = mockRes();
    const err = new Error('fail');
    Event.findByPk.mockRejectedValue(err);
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getEvent(req, res);
    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });
});
