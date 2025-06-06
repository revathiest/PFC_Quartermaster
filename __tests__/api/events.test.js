jest.mock('../../config/database', () => ({ Event: { findAll: jest.fn() } }));
const { listEvents } = require('../../api/events');
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
