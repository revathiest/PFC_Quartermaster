const { buildOptionsSummary } = require('../../../../botactions/eventHandling/interactionEvents/buildOptionsSummary');

const mockGuild = {
  members: {
    cache: new Map([
      ['user123', { user: { globalName: 'GlobalKen', username: 'KenUser' } }],
      ['mentionUser', { user: { username: 'MentionUser' } }],
    ])
  },
  roles: {
    cache: new Map([
      ['role123', { name: 'Moderator' }],
      ['mentionRole', { name: 'MentionRole' }],
    ])
  }
};

describe('buildOptionsSummary', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });
  it('returns "no options" when no options provided', async () => {
    const interaction = { options: { data: [] } };
    const result = await buildOptionsSummary(interaction);
    expect(result).toBe('no options');
  });

  it('formats string, integer, number, and boolean types', async () => {
    const interaction = {
      options: {
        data: [
          { name: 'strOpt', type: 3, value: 'hello' },
          { name: 'intOpt', type: 4, value: 42 },
          { name: 'numOpt', type: 10, value: 3.14 },
          { name: 'boolOpt', type: 5, value: true },
        ]
      }
    };

    const result = await buildOptionsSummary(interaction);
    expect(result).toBe('strOpt: "hello", intOpt: 42, numOpt: 3.14, boolOpt: true');
  });

  it('resolves USER and ROLE types from cache', async () => {
    const interaction = {
      guild: mockGuild,
      options: {
        data: [
          { name: 'userOpt', type: 6, value: 'user123' },
          { name: 'roleOpt', type: 8, value: 'role123' }
        ]
      }
    };

    const result = await buildOptionsSummary(interaction);
    expect(result).toBe('userOpt: GlobalKen, roleOpt: @Moderator');
  });

  it('handles unfound USER and ROLE with fallback', async () => {
    const interaction = {
      guild: { members: { cache: new Map() }, roles: { cache: new Map() } },
      options: {
        data: [
          { name: 'userOpt', type: 6, value: 'missingUser' },
          { name: 'roleOpt', type: 8, value: 'missingRole' }
        ]
      }
    };

    const result = await buildOptionsSummary(interaction);
    expect(result).toBe('userOpt: <UnknownUser>, roleOpt: <UnknownRole>');
  });

  it('resolves CHANNEL via client.channels.fetch()', async () => {
    const interaction = {
      client: {
        channels: {
          fetch: jest.fn().mockResolvedValue({ name: 'bot-channel' })
        }
      },
      options: {
        data: [
          { name: 'chanOpt', type: 7, value: 'chan123' }
        ]
      }
    };

    const result = await buildOptionsSummary(interaction);
    expect(result).toBe('chanOpt: #bot-channel');
  });

  it('handles channel fetch failure gracefully', async () => {
    const interaction = {
      client: {
        channels: {
          fetch: jest.fn().mockRejectedValue(new Error('boom'))
        }
      },
      options: {
        data: [
          { name: 'chanOpt', type: 7, value: 'chan404' }
        ]
      }
    };

    const result = await buildOptionsSummary(interaction);
    expect(result).toBe('chanOpt: <UnknownChannel>');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('resolves MENTIONABLE as user first, then role, or unknown', async () => {
    const interaction = {
      guild: mockGuild,
      options: {
        data: [
          { name: 'mentionUser', type: 9, value: 'mentionUser' },
          { name: 'mentionRole', type: 9, value: 'mentionRole' },
          { name: 'unknownMention', type: 9, value: 'ghost' }
        ]
      }
    };

    const result = await buildOptionsSummary(interaction);
    expect(result).toBe('mentionUser: MentionUser, mentionRole: @MentionRole, unknownMention: <UnknownMentionable>');
  });

  it('handles unknown type fallback', async () => {
    const interaction = {
      options: {
        data: [
          { name: 'weird', type: 99, value: 'strange' }
        ]
      }
    };

    const result = await buildOptionsSummary(interaction);
    expect(result).toBe('weird: strange');
  });
});
