jest.mock('../../../config/database', () => ({
  Accolade: {
    findOne: jest.fn()
  }
}));
jest.mock('../../../utils/accoladeEmbedBuilder');
const { execute } = require('../../../commands/admin/updateaccolade');
const { Accolade } = require('../../../config/database');
const { buildAccoladeEmbed } = require('../../../utils/accoladeEmbedBuilder');
const { MessageFlags } = require('discord.js');

const makeInteraction = (emoji = '<:medal:1>', desc = 'desc', members = []) => {
  const guild = {
    channels: { fetch: jest.fn(() => ({ type: 0, messages: { fetch: jest.fn(() => Promise.resolve({ edit: jest.fn() })) }, send: jest.fn(() => ({ id: 'mid' })) })) },
    members: {
      fetch: jest.fn(() => Promise.resolve()),
      cache: {
        filter: jest.fn(fn => ({
          map: mapFn => members.filter(fn).map(mapFn)
        }))
      }
    }
  };
  return {
    options: {
      getRole: jest.fn(() => ({ id: 'r1', name: 'Role' })),
      getString: jest.fn(name => (name === 'emoji' ? emoji : desc))
    },
    guild,
    reply: jest.fn()
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('/updateaccolade command', () => {
  test('rejects invalid emoji', async () => {
    const interaction = makeInteraction('invalid');
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('valid emoji'), flags: MessageFlags.Ephemeral }));
  });

  test('updates accolade and message', async () => {
    const members = [{ roles: { cache: { has: () => true } } }];
    const interaction = makeInteraction(undefined, undefined, members);
    Accolade.findOne.mockResolvedValue({ role_id: 'r1', name: 'Test', save: jest.fn(), channel_id: 'c1', message_id: 'm1', emoji: '', description: '' });
    buildAccoladeEmbed.mockReturnValue('embed');

    await execute(interaction);

    expect(Accolade.findOne).toHaveBeenCalledWith({ where: { role_id: 'r1' } });
    expect(buildAccoladeEmbed).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ content: expect.stringContaining('updated'), flags: MessageFlags.Ephemeral });
  });

  test('rejects when accolade not found', async () => {
    const interaction = makeInteraction();
    Accolade.findOne.mockResolvedValue(null);

    await execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('not registered'), flags: MessageFlags.Ephemeral }));
  });

  test('requires at least one field to update', async () => {
    const interaction = makeInteraction(null, null);
    Accolade.findOne.mockResolvedValue({ role_id: 'r1', name: 'Test', save: jest.fn() });

    await execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('at least one field'), flags: MessageFlags.Ephemeral }));
  });

  test('creates a new message when previous one is missing', async () => {
    const member = { roles: { cache: { has: () => true } } };
    const guild = {
      channels: { fetch: jest.fn(() => ({
        type: 0,
        messages: { fetch: jest.fn(() => Promise.reject(new Error('no msg'))) },
        send: jest.fn(() => ({ id: 'new' }))
      })) },
      members: {
        fetch: jest.fn(() => Promise.resolve()),
        cache: { filter: jest.fn(fn => ({ map: mapFn => [member].filter(fn).map(mapFn) })) }
      }
    };
    const interaction = { options: { getRole: jest.fn(() => ({ id: 'r1' })), getString: jest.fn(() => '<:e:1>') }, guild, reply: jest.fn() };
    const accolade = { role_id: 'r1', name: 'Test', save: jest.fn(), channel_id: 'c1', message_id: 'old', emoji: '', description: '' };
    Accolade.findOne.mockResolvedValue(accolade);
    buildAccoladeEmbed.mockReturnValue('embed');

    await execute(interaction);

    expect(guild.channels.fetch).toHaveBeenCalledWith('c1');
    expect(accolade.message_id).toBe('new');
    expect(accolade.save).toHaveBeenCalledTimes(2);
    expect(interaction.reply).toHaveBeenCalledWith({ content: expect.stringContaining('updated'), flags: MessageFlags.Ephemeral });
  });

  test('logs an error when channel fetch fails', async () => {
    const interaction = makeInteraction();
    Accolade.findOne.mockResolvedValue({ role_id: 'r1', name: 'Test', save: jest.fn(), channel_id: 'c1', message_id: 'm1' });
    interaction.guild.channels.fetch.mockRejectedValue(new Error('fail'));
    await execute(interaction);
    expect(console.error).toHaveBeenCalled();
  });
});
