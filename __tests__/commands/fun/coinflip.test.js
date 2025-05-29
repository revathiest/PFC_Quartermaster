const coinflip = require('../../../commands/fun/coinflip');
const { MessageFlags } = require('../../../__mocks__/discord.js');

jest.useFakeTimers();

const makeGuild = (hasTesterRole = false) => {
  const challengerMember = {
    displayName: 'Challenger',
    roles: { cache: { has: jest.fn(() => hasTesterRole) } },
  };
  const opponentMember = {
    displayName: 'Opponent',
    roles: { cache: { has: jest.fn() } },
  };
  return {
    members: {
      fetch: jest.fn(id => (id === 'challenger' ? challengerMember : opponentMember)),
    },
    roles: {
      cache: {
        find: jest.fn(fn => (fn({ name: 'Fleet Admiral' }) ? { id: 'fa', name: 'Fleet Admiral' } : undefined)),
      },
    },
  };
};

const makeChallengeInteraction = ({ self = false, hasTesterRole = false } = {}) => {
  const user = { id: 'challenger' };
  const opponent = { id: self ? 'challenger' : 'opponent' };
  return {
    user,
    options: {
      getSubcommand: jest.fn(() => 'challenge'),
      getUser: jest.fn(() => opponent),
    },
    guild: makeGuild(hasTesterRole),
    reply: jest.fn(),
  };
};

const makeCallInteraction = (choice) => {
  return {
    user: { id: 'opponent' },
    options: {
      getSubcommand: jest.fn(() => 'call'),
      getString: jest.fn(() => choice),
    },
    guild: makeGuild(),
    client: { users: { fetch: jest.fn(() => ({ id: 'challenger' })) } },
    reply: jest.fn(),
  };
};

describe('/coinflip command', () => {
  let originalRandom;
  beforeEach(() => {
    jest.useFakeTimers();
    originalRandom = Math.random;
    Math.random = jest.fn(() => 0); // always heads
  });

  afterEach(() => {
    Math.random = originalRandom;
    jest.useRealTimers();
  });

  test('rejects self challenge without role', async () => {
    const interaction = makeChallengeInteraction({ self: true });
    await coinflip.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('challenge yourself'),
      flags: MessageFlags.Ephemeral,
    });
  });

  test('handles challenge and call flow', async () => {
    const challenge = makeChallengeInteraction();
    await coinflip.execute(challenge);
    expect(challenge.reply).toHaveBeenCalledWith(expect.stringContaining('has challenged'));

    const call = makeCallInteraction('heads');
    await coinflip.execute(call);
    expect(call.reply.mock.calls[0][0].embeds[0].toJSON().description).toContain('wins the toss');

    // second call after challenge resolved
    call.reply.mockClear();
    await coinflip.execute(call);
    expect(call.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('no pending coin flip'),
      flags: MessageFlags.Ephemeral,
    });
  });

  test('challenge expires after timeout', async () => {
    const challenge = makeChallengeInteraction();
    await coinflip.execute(challenge);
    jest.advanceTimersByTime(2 * 60 * 1000);

    const call = makeCallInteraction('heads');
    await coinflip.execute(call);
    expect(call.reply).toHaveBeenCalledWith({
      content: expect.stringContaining('no pending coin flip'),
      flags: MessageFlags.Ephemeral,
    });
  });
});
