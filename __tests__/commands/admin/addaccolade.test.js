const { execute } = require('../../../commands/admin/addaccolade');
const { Accolade } = require('../../../config/database');
const { buildAccoladeEmbed } = require('../../../utils/accoladeEmbedBuilder');
const { MessageFlags } = require('discord.js');

jest.mock('../../../config/database', () => ({
  Accolade: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../../utils/accoladeEmbedBuilder');

jest.mock('../../../config.json', () => ({
  wallOfFameChannelId: 'wall123',
}), { virtual: true });

function createInteraction({ isAdmin = true, emoji = '<:medal:12345>' } = {}) {
  const role = { id: 'role1', name: 'Honored' };
  const channel = {
    id: 'wall123',
    type: 0,
    send: jest.fn().mockResolvedValue({ id: 'message123' }),
  };

  const membersCollection = {
    map: jest.fn(fn => [fn({ displayName: 'User', roles: { cache: { has: () => true } } })]),
  };

  const guild = {
    channels: { fetch: jest.fn().mockReturnValue(channel) },
    members: {
      fetch: jest.fn().mockResolvedValue(),
      cache: { filter: jest.fn(() => membersCollection) },
    },
  };

  return {
    member: {
      permissions: {
        has: jest.fn(() => isAdmin),
      },
    },
    options: {
      getRole: jest.fn(() => role),
      getString: jest.fn(name => {
        if (name === 'emoji') return emoji;
        if (name === 'description') return 'Great job';
        return null;
      }),
    },
    guild,
    reply: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('/addaccolade command', () => {
  it('rejects non-admin users', async () => {
    const interaction = createInteraction({ isAdmin: false });

    await execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('administrators'),
        flags: MessageFlags.Ephemeral,
      }),
    );
  });

  it('creates accolade and posts embed for valid input', async () => {
    const interaction = createInteraction();
    Accolade.findOne.mockResolvedValue(null);
    buildAccoladeEmbed.mockReturnValue('embed');

    await execute(interaction);

    expect(Accolade.findOne).toHaveBeenCalledWith({ where: { role_id: 'role1' } });
    expect(buildAccoladeEmbed).toHaveBeenCalled();
    expect(interaction.guild.channels.fetch).toHaveBeenCalledWith('wall123');
    expect(interaction.guild.members.fetch).toHaveBeenCalled();
    expect(interaction.guild.channels.fetch.mock.results[0].value.send).toBeDefined();
    expect(Accolade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role_id: 'role1',
        name: 'Honored',
        emoji: '<:medal:12345>',
        description: 'Great job',
        channel_id: 'wall123',
        message_id: 'message123',
      }),
    );
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('registered'),
        flags: MessageFlags.Ephemeral,
      }),
    );
  });

  it('rejects invalid emoji input', async () => {
    const interaction = createInteraction({ emoji: 'notemoji' });

    await execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('valid emoji'),
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(Accolade.create).not.toHaveBeenCalled();
  });

  it('rejects when role is already registered', async () => {
    const interaction = createInteraction();
    Accolade.findOne.mockResolvedValue({ id: 'existing' });

    await execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('already registered'),
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(Accolade.create).not.toHaveBeenCalled();
  });

  it('rejects when Wall of Fame channel is missing', async () => {
    const interaction = createInteraction();
    Accolade.findOne.mockResolvedValue(null);
    interaction.guild.channels.fetch.mockReturnValue(null);

    await execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Wall of Fame channel'),
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(Accolade.create).not.toHaveBeenCalled();
  });

  it('handles empty emoji and description defaults', async () => {
    const interaction = createInteraction({ emoji: null });
    interaction.options.getString = jest.fn(name => null);
    Accolade.findOne.mockResolvedValue(null);
    buildAccoladeEmbed.mockReturnValue('embed');

    await execute(interaction);

    expect(Accolade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        emoji: '',
        description: 'No description provided.',
      }),
    );
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('registered'),
        flags: MessageFlags.Ephemeral,
      }),
    );
  });
});
