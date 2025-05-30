jest.mock('../../../../botactions/config/database.js', () => require('../../../../__mocks__/config/database'));
const { UsageLog } = require('../../../../botactions/config/database.js');
const logMessage = require('../../../../botactions/eventHandling/messageEvents/logHandler');

describe('logHandler logMessage', () => {
  let message;
  beforeEach(() => {
    jest.clearAllMocks();
    message = { id: '1', content: 'text', channel: { id: 'c' }, author: { id: 'u' } };
  });

  test('logs message successfully', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await logMessage(message, 's1');
    expect(UsageLog.create).toHaveBeenCalledWith(expect.objectContaining({ message_id: '1', server_id: 's1' }));
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  test('logs error when create fails', async () => {
    UsageLog.create.mockRejectedValue(new Error('fail'));
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    await logMessage(message, 's1');
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});
