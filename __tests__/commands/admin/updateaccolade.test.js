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

const makeInteraction = (emoji = '<:medal:1>', desc = 'desc') => {
  const guild = {
    channels: { fetch: jest.fn(() => ({ type: 0, messages: { fetch: jest.fn(() => Promise.resolve({ edit: jest.fn() })) }, send: jest.fn(() => ({ id: 'mid' })) })) },
    members: { fetch: jest.fn(() => Promise.resolve()), cache: { filter: jest.fn(() => ({ map: fn => [] })) } }
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
});

describe('/updateaccolade command', () => {
  test('rejects invalid emoji', async () => {
    const interaction = makeInteraction('invalid');
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('valid emoji'), flags: MessageFlags.Ephemeral }));
  });

  test('updates accolade and message', async () => {
    const interaction = makeInteraction();
    Accolade.findOne.mockResolvedValue({ role_id: 'r1', name: 'Test', save: jest.fn(), channel_id: 'c1', message_id: 'm1', emoji: '', description: '' });
    buildAccoladeEmbed.mockReturnValue('embed');

    await execute(interaction);

    expect(Accolade.findOne).toHaveBeenCalledWith({ where: { role_id: 'r1' } });
    expect(buildAccoladeEmbed).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ content: expect.stringContaining('updated'), flags: MessageFlags.Ephemeral });
  });
});
