const { logInteraction } = require('../../../../botactions/eventHandling/interactionEvents/logInteraction');
const { UsageLog } = require('../../../../config/database');

jest.mock('../../../../config/database', () => ({
  UsageLog: { create: jest.fn() }
}));

describe('logInteraction', () => {
  let consoleLogSpy, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  function buildInteraction({
    userProps = {},
    channelProps = {},
    fetchThrows = false,
    subcommand = 'run',
  } = {}) {
    const user = userProps ? { id: 'user123', ...userProps } : undefined;

    const channel = channelProps
      ? {
          id: 'chan123',
          name: 'default-name',
          recipient: { username: 'DMUser' },
          ...channelProps,
          fetch: fetchThrows
            ? () => Promise.reject(new Error('fetch failed'))
            : async () => ({ id: 'chan123', name: 'fetched-name', ...channelProps }),
        }
      : undefined;

    return {
      user,
      options: {
        getSubcommand:
          typeof subcommand === 'undefined' ? undefined : jest.fn(() => subcommand),
      },
      channel,
    };
  }

  const baseParams = {
    type: 'command',
    event: 'command_used',
    commandName: 'whois',
    serverId: 'guild123',
    optionsSummary: 'target=KenHart',
  };

  it('Case 1: Happy path - full user props, fetch ok, subcommand + optionsSummary', async () => {
    const interaction = buildInteraction({
      userProps: { globalName: 'KenHart' },
      channelProps: { name: 'bot-commands' },
    });

    await logInteraction({ interaction, ...baseParams });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[COMMAND Logged] /whois run by KenHart in #bot-commands with target=KenHart')
    );

    expect(UsageLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user123',
        interaction_type: 'command',
        event_type: 'command_used',
        command_name: 'whois',
        channel_id: 'chan123',
        server_id: 'guild123',
      })
    );
  });

  it('Case 2: Fallback to username, no fetch', async () => {
    const interaction = buildInteraction({
      userProps: { username: 'Ken' },
      channelProps: { name: 'general', fetch: undefined },
    });

    interaction.channel.fetch = undefined;
    await logInteraction({ interaction, ...baseParams });
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('by Ken'));
  });

  it('Case 3: Only tag, fetch throws', async () => {
    const interaction = buildInteraction({
      userProps: { tag: 'Ken#1234' },
      channelProps: { name: 'logless' },
      fetchThrows: true,
    });

    await logInteraction({ interaction, ...baseParams, optionsSummary: 'some=option' });
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('by Ken#1234'));
  });

  it('Case 4: Missing user, no optionsSummary', async () => {
    const interaction = buildInteraction();
    interaction.user = undefined;

    await logInteraction({ interaction, ...baseParams, optionsSummary: '' });
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('by unknown_user'));
  });

  it('Case 5: No channel', async () => {
    const interaction = buildInteraction();
    interaction.channel = undefined;

    await logInteraction({ interaction, ...baseParams, optionsSummary: '' });
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('in #unknown_channel'));
  });

  it('Case 6: fetch() throws, fallback to recipient', async () => {
    const interaction = buildInteraction({
      userProps: { username: 'Test' },
      channelProps: {
        name: undefined, // ensure .name is missing so it falls back
        recipient: { username: 'DMUser' }
      },
      fetchThrows: true,
    });
  
    await logInteraction({ interaction, ...baseParams });
  
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('in #DMUser'));
  });
  

  it('Case 7: Non-string type coerces to unknown', async () => {
    const interaction = buildInteraction();
    await logInteraction({ interaction, ...baseParams, type: 42 });
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/^✅ \[UNKNOWN Logged\]/));
  });

  it('Case 8: Non-string event coerces', async () => {
    const interaction = buildInteraction();
    await logInteraction({ interaction, ...baseParams, event: 1337 });
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[COMMAND Logged]'));
  });

  it('Case 9: Non-string commandName fallback', async () => {
    const interaction = buildInteraction();
    await logInteraction({ interaction, ...baseParams, commandName: {} });
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('/unknown'));
  });

  it('Case 10: Non-string serverId fallback', async () => {
    const interaction = buildInteraction();
    await logInteraction({ interaction, ...baseParams, serverId: {} });
    expect(UsageLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        server_id: 'unknown',
      })
    );
  });

  it('Case 11: DB write throws, logs error', async () => {
    const interaction = buildInteraction();
    UsageLog.create.mockImplementation(() => { throw new Error('DB write failed'); });
    await logInteraction({ interaction, ...baseParams });
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌ [COMMAND Log Error]'), expect.any(Error));
  });

  it('Case 12: Entire block throws, undefined input', async () => {
    // @ts-expect-error: intentionally testing undefined input
    await logInteraction(undefined);
  
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('❌ [UNKNOWN Log Error]'),
      expect.any(Error)
    );
  });  
});
