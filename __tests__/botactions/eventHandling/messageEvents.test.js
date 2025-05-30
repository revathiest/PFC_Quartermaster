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

  test('blocks openai in disallowed channel', async () => {
    fs.readFileSync.mockReturnValue(JSON.stringify({ allowedChannelNames: ['other'], default: ['Prompt'] }));
    message.guild.channels.cache.find.mockReturnValue({ isTextBased: () => true, toString: () => '#other' });

    await messageEvents.handleMessageCreate(message, client);

    expect(mockChatCreate).not.toHaveBeenCalled();
    expect(message.reply).toHaveBeenCalledWith(expect.stringContaining('#other'));
  });

  test('warns when openai returns empty reply', async () => {
    mockChatCreate.mockResolvedValueOnce({ choices: [{ message: { content: null } }] });
    await messageEvents.handleMessageCreate(message, client);
    expect(message.reply).toHaveBeenCalledWith("Hmm, I didn’t quite catch that. Try again?");
  });

  test('handles openai error gracefully', async () => {
    mockChatCreate.mockRejectedValueOnce(new Error('fail'));
    await messageEvents.handleMessageCreate(message, client);
    expect(message.reply).toHaveBeenCalledWith("Sorry, I couldn't fetch a reply right now.");
  });

  test('uses custom user prompt when configured', async () => {
    fs.readFileSync.mockReturnValueOnce(
      JSON.stringify({ allowedChannelNames: ['general'], default: ['Base'], users: { u1: ['UserPrompt'] } })
    );
    await messageEvents.handleMessageCreate(message, client);
    expect(mockChatCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: 'UserPrompt' },
          expect.any(Object)
        ]
      })
    );
  });

  test('adds role based prompt when matched', async () => {
    fs.readFileSync.mockReturnValueOnce(
      JSON.stringify({
        allowedChannelNames: ['general'],
        default: ['Base'],
        roles: { admin: ['RolePrompt'] },
        roleMappings: { admin: ['Commander'] }
      })
    );
    message.member.roles.cache = [{ name: 'Commander' }];
    await messageEvents.handleMessageCreate(message, client);
    expect(mockChatCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: 'Base\n\nRolePrompt' },
          expect.any(Object)
        ]
      })
    );
  });

  test('logs error when message logging fails', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    UsageLog.create.mockRejectedValueOnce(new Error('fail'));
    message.mentions.has.mockReturnValue(false);
    message.content = 'hello';
    await messageEvents.handleMessageCreate(message, client);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  test('regex triggers performAction', async () => {
    const spy = jest.spyOn(messageEvents, 'performAction');
    const filter = require('../../../messages.json');
    filter.regex['fo+'] = { action: 'respond', response: 'regex' };
    message.mentions.has.mockReturnValue(false);
    message.content = 'foooo';
    await messageEvents.handleMessageCreate(message, client);
    expect(spy).toHaveBeenCalledWith(message, client, filter.regex['fo+']);
    spy.mockRestore();
  });
});

describe('messageEvents performAction', () => {
  let message, client, responseChannel;
  beforeEach(() => {
    responseChannel = { isTextBased: () => true, send: jest.fn() };
    message = {
      author: { id: 'u1', username: 'User' },
      channel: { name: 'chan', send: jest.fn(), isTextBased: () => true },
      content: 'content',
      delete: jest.fn()
    };
    client = { channels: { cache: new Map([['alert', responseChannel]]) }, chanProfanityAlert: 'alert' };
  });

  test('personal action matches by username', () => {
    const res = messageEvents.performAction({ ...message, author: { id: 'x', username: 'u1' } }, client, { action: 'personal', userId: 'u1', response: 'hi' });
    expect(message.channel.send).toHaveBeenCalledWith('hi');
    expect(res).toBe(true);
  });

  test('personal action ignored when user does not match', () => {
    const res = messageEvents.performAction(message, client, { action: 'personal', userId: 'other', response: 'hi' });
    expect(res).toBe(false);
  });

  test('delete action notifies channel and deletes', () => {
    const res = messageEvents.performAction(message, client, { action: 'delete' });
    expect(message.delete).toHaveBeenCalled();
    expect(responseChannel.send).toHaveBeenCalledTimes(2);
    expect(res).toBe(true);
  });
});
