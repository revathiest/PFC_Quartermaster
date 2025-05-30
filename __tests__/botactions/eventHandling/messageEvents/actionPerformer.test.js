const performAction = require('../../../../botactions/eventHandling/messageEvents/actionPerformer');

describe('performAction', () => {
  let message, client, responseChannel;
  beforeEach(() => {
    responseChannel = { isTextBased: () => true, send: jest.fn() };
    message = {
      author: { id: 'u1', username: 'User' },
      channel: { name: 'chan', send: jest.fn(), isTextBased: () => true },
      content: 'content',
      delete: jest.fn()
    };
    client = { channels: { cache: { get: jest.fn(() => responseChannel) } }, chanProfanityAlert: 'alert' };
    jest.clearAllMocks();
  });

  test('handles personal action for matching user', () => {
    const res = performAction(message, client, { action: 'personal', userId: 'u1', response: 'hi' });
    expect(message.channel.send).toHaveBeenCalledWith('hi');
    expect(res).toBe(true);
  });

  test('ignores personal action for non-matching user', () => {
    console.log = jest.fn();
    const res = performAction(message, client, { action: 'personal', userId: 'other', response: 'hi' });
    expect(message.channel.send).not.toHaveBeenCalled();
    expect(res).toBe(false);
  });

  test('sends response when action is respond', () => {
    const res = performAction(message, client, { action: 'respond', response: 'hello' });
    expect(message.channel.send).toHaveBeenCalledWith('hello');
    expect(res).toBe(true);
  });

  test('deletes message and notifies when action is delete', () => {
    const res = performAction(message, client, { action: 'delete' });
    expect(message.delete).toHaveBeenCalled();
    expect(responseChannel.send).toHaveBeenCalledTimes(2);
    expect(res).toBe(true);
  });
});
