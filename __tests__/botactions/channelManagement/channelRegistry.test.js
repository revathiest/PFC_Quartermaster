const { registerChannels } = require('../../../botactions/channelManagement/channelRegistry');

const allNames = [
  'star-citizen-news',
  'pfc-bot-testing',
  'pfc-bot-activity-log',
  'profanity-alert',
  'division-signup',
  '🔥-pfc-lobby'
];

const createMockClient = (names) => {
  const channels = names.map((name, i) => ({ id: String(i + 1), name, type: 0 }));
  return {
    channels: {
      cache: {
        each: (fn) => channels.forEach(fn)
      }
    }
  };
};

describe('registerChannels', () => {
  let warnSpy, errorSpy, logSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('returns true when all expected channels are present', () => {
    const client = createMockClient(allNames);
    const result = registerChannels(client);

    expect(result).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    // Ensure each mapping property was set
    expect(client.chanSCNews).toBeDefined();
    expect(client.chanBotTest).toBeDefined();
    expect(client.chanBotLog).toBeDefined();
    expect(client.chanProfanityAlert).toBeDefined();
    expect(client.chanDivSignup).toBeDefined();
    expect(client.chanLobby).toBeDefined();
  });

  it('returns false and logs warnings/errors when channels are missing', () => {
    const subset = ['star-citizen-news', 'pfc-bot-testing'];
    const client = createMockClient(subset);
    const result = registerChannels(client);

    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      '❌ One or more channels could not be found. Check names and server settings.'
    );
  });
});
