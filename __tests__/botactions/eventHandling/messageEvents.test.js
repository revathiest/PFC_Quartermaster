jest.mock('../../../botactions/ambient/ambientEngine', () => ({ trackChannelActivity: jest.fn() }));
jest.mock('../../../messages.json', () => ({ words: { bad: { action: 'respond', response: 'no' } }, regex: {} }));
jest.mock('fs');
const mockChatCreate = jest.fn().mockResolvedValue({ choices: [{ message: { content: 'hi' } }] });
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({ chat: { completions: { create: mockChatCreate } } }));
});

const fs = require('fs');
const { trackChannelActivity } = require('../../../botactions/ambient/ambientEngine');
const { UsageLog } = require('../../../config/database');
const messageEvents = require('../../../botactions/eventHandling/messageEvents');

jest.mock('../../../config/database', () => require('../../../__mocks__/config/database'));

process.env.OPENAI_MODEL = 'model';

describe('messageEvents handleMessageCreate', () => {
  let message, client;
  beforeEach(() => {
    jest.clearAllMocks();
    message = {
      content: '<@1> hello',
      guild: { id: 'g1', channels: { cache: { find: jest.fn(() => ({ isTextBased: () => true })) } } },
      channel: { name: 'general', send: jest.fn() },
      author: { id: 'u1', bot: false },
      member: { roles: { cache: [] } },
      mentions: { has: jest.fn(() => true), everyone: false, here: false },
      reply: jest.fn()
    };
    client = { user: {}, channels: { cache: new Map() } };
    fs.readFileSync.mockReturnValue(JSON.stringify({ allowedChannelNames: ['general'], default: ['Prompt'] }));
  });

  test('ignores messages without guild', async () => {
    await messageEvents.handleMessageCreate({ guild: null, author: { bot: false } }, client);
    expect(trackChannelActivity).not.toHaveBeenCalled();
  });

  test('responds via openai when mentioned', async () => {
    await messageEvents.handleMessageCreate(message, client);
    expect(mockChatCreate).toHaveBeenCalled();
    expect(message.reply).toHaveBeenCalledWith('hi');
  });

  test('logs and filters when not mentioned', async () => {
    message.mentions.has.mockReturnValue(false);
    message.content = 'bad';
    await messageEvents.handleMessageCreate(message, client);
    expect(UsageLog.create).toHaveBeenCalled();
    expect(message.channel.send).toHaveBeenCalledWith('no');
  });
});
