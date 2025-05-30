jest.mock('discord.js', () => {
  const mockConstructor = jest.fn();
  class MockClient {
    constructor(options) {
      mockConstructor(options);
      this.options = options;
    }
  }
  return {
    Client: MockClient,
    GatewayIntentBits: {
      Guilds: 1,
      GuildMessages: 2,
      GuildMembers: 3,
      GuildVoiceStates: 4,
      DirectMessages: 5,
      MessageContent: 6,
      GuildScheduledEvents: 7,
      GuildPresences: 8,
      GuildIntegrations: 9,
      GuildMessageReactions: 10
    },
    Partials: { Message: 'm', Channel: 'c', Reaction: 'r' },
    __mockConstructor: mockConstructor
  };
});

const { initClient } = require('../../botactions/initClient');
const { __mockConstructor } = require('discord.js');

describe('initClient', () => {
  test('creates client with correct options', () => {
    const client = initClient();
    expect(__mockConstructor).toHaveBeenCalledWith(expect.objectContaining({ intents: expect.any(Array), partials: expect.any(Array) }));
    expect(client.options.intents).toContain(1);
    expect(client.options.partials).toContain('m');
  });
});
