jest.mock('../../../messages.json', () => ({
  words: {
    hello: { action: 'respond', response: 'hi there' },
    bad: { action: 'delete', response: 'nope' }
  },
  regex: {
    '/abc/': { action: 'respond', response: 'regex hi' },
    '/bad\\d+/': { action: 'delete', response: 'regex bad' }
  }
}), { virtual: true });

const { process_messages } = require('../../../botactions/commandHandling/process_messages');

describe('process_messages', () => {
  let message;
  beforeEach(() => {
    message = {
      content: 'hello friend',
      author: { bot: false, username: 'u' },
      channel: { name: 'gen', send: jest.fn() },
      client: { channels: { cache: new Map([['1', { send: jest.fn(), isText: () => true, isTextBased: () => true, type: 0 }]]) } },
      delete: jest.fn(),
    };
  });

  test('responds when word action is respond', () => {
    process_messages(message, true, '1');
    expect(message.channel.send).toHaveBeenCalledWith('hi there');
    expect(message.delete).not.toHaveBeenCalled();
  });

  test('deletes message when action is delete', () => {
    message.content = 'bad word';
    process_messages(message, true, '1');
    const responseChannel = message.client.channels.cache.get('1');
    expect(responseChannel.send).toHaveBeenCalled();
    expect(message.delete).toHaveBeenCalled();
  });

  test('ignores bot messages', () => {
    message.author.bot = true;
    const result = process_messages(message, true, '1');
    expect(result).toBe(false);
    expect(message.channel.send).not.toHaveBeenCalled();
  });

  test('does nothing when allowmessage is false', () => {
    process_messages(message, false, '1');
    expect(message.channel.send).not.toHaveBeenCalled();
    expect(message.delete).not.toHaveBeenCalled();
  });

  test('handles regex respond action', () => {
    message.content = 'abc';
    process_messages(message, true, '1');
    expect(message.channel.send).toHaveBeenCalledWith('regex hi');
  });

  test('handles regex delete with missing response channel', () => {
    message.content = 'bad123';
    message.client.channels.cache.clear();
    process_messages(message, true, 'missing');
    expect(message.delete).toHaveBeenCalled();
  });
});
